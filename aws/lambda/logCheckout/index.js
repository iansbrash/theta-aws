var AWS = require("aws-sdk");
AWS.config.update({
    region: "us-east-1",
});
var docClient = new AWS.DynamoDB.DocumentClient();
var axios = require('axios')
var qs = require('qs')

exports.handler = async function(event, context) {        
    console.log('Received event:', JSON.stringify(event, null, 2));
    var headers = event.headers;
    
    // What do we need?
    // Validate session
    // Validate license
    // Use license to write to the appropriate license object
    //      What headers do we need?
    //          {date, orderNumber, product, profile, site, size} and price?
    
    // Validate session and license
    let getLicenseParams = {
        TableName: 'licenseKeys', 
        Key:
        {
            "license": headers.license
        }
    }
    
    let licenseObject = await docClient.get(getLicenseParams).promise();
    
    if (licenseObject.Item === undefined) {
        // This shouldn't happen because we use a Lambda authorizer before
        return {
            "isBase64Encoded": false,
            "statusCode": 404,
            "body": "Invalid License"
        }
    }
    
    const {
        license,
        session,
        // date,
        orderNumber,
        product,
        profile,
        site,
        size,
        price,
        image
    } = headers;
    
    // Increment analytics/basic/checkouts
    let incrementCheckoutsParams = {
        TableName: 'licenseKeys',
        Key:{
            "license": licenseObject.Item.license
        },
        UpdateExpression: "set analytics.basic.checkouts = :ch, analytics.basic.totalSpent = :ts",
        ExpressionAttributeValues:{
            ":ch": licenseObject.Item.analytics.basic.checkouts + 1,
            ":ts": licenseObject.Item.analytics.basic.totalSpent + price,
        },
        ReturnValues:"UPDATED_NEW"
    }
    
        
    let res = await docClient.update(incrementCheckoutsParams).promise()
    // Increment analytics/basics/totalSpent
    console.log(res)
    
    // Checkout we are pushing
    let newCheckout = {
        date: (new Date()).getTime(),
        orderNumber: orderNumber,
        product: product,
        profile: profile,
        site: site,
        size: size,
        price: price,
        image: image
    }
    
    // Push to analytics/checkouts
    let pushToCheckoutsParams = {
        TableName: 'licenseKeys',
        Key:{
            "license": licenseObject.Item.license
        },
        UpdateExpression: "set analytics.checkouts = :ch",
        ExpressionAttributeValues:{
            ":ch": [newCheckout, ...licenseObject.Item.analytics.checkouts],
        },
        ReturnValues:"UPDATED_NEW"
    }
    
    let res2 = await docClient.update(pushToCheckoutsParams).promise()

    // Send success discord webhook
    try {
        let payload = {
            "content": null,
            "embeds": [
              {
                "title": product,
                "url": "https://amazon.com/",
                "color": 5814783,
                "fields": [
                  {
                    "name": "store",
                    "value": site,
                    "inline": true
                  },
                  {
                    "name": "Size",
                    "value": size,
                    "inline": true
                  },
                  {
                    "name": "Mode",
                    "value": "Normal",
                    "inline": true
                  }
                ],
                "author": {
                  "name": "Successful checkout!"
                },
                "footer": {
                  "text": "Thaeta"
                },
                "timestamp": (new Date()).toISOString(),
                "thumbnail": {
                  "url": image
                }
              }
            ],
            "username": "Thaeta"
        }

        var data = qs.stringify({
            'payload_json': JSON.stringify(payload)
        });

        let wh  = 'https://discord.com/api/webhooks/867494114903719936/rkhbOFvos0TlCR-KF2wk4N93HZZGhRFEMX8cmLzj9-yGJ3OnboM4Rz3cEu56YQ8SxvvT'

        await axios({
            method: 'post',
            url: wh,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', 
            },
            data : data
        })
    }
    catch (err) {
        console.error("Error posting success to discord")
    }
    
    
    return {
        "isBase64Encoded": false,
        "statusCode": 200,
        "body": "Success"
    }
    
    // Push to other logging source for overall admin analytics dashboard?
    // We should do that from here so we don't expose another endpoint people can spam
};
