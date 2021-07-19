var AWS = require("aws-sdk");
AWS.config.update({
    region: "us-east-1",
});
var docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async function(event, context) {        
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Retrieve request parameters from the Lambda function input:
    var headers = event.headers;
    
    const {
        startingKey,
        amount
    } = headers;
        
    const params = {
        TableName: 'licenseKeys',
        Key:
        {
            "license": headers.license
        }
    }
    
    let result = await docClient.get(params).promise();
    
    if (result.Item !== undefined && result.Item !== null) {
        let ch = result.Item.analytics.checkouts;
        
        // We'll use timestamp as startingKey
        let startIndex = 0;
        if (startingKey && startingKey !== '') {
            startIndex = ch.findIndex(chObj => chObj.date === startingKey) + 1
            
            if (startIndex === -1) {
                return {
                    "isBase64Encoded": false,
                    "statusCode": 400,
                    "body": "Invalid startingKey"
                }
            }
        }
        
        let toReturn;
        
        if (startIndex === ch.length) {
            return {
                "isBase64Encoded": false,
                "statusCode": 401,
                "body": "End of checkouts reached"
            }
        }
        
        ch = ch.slice(startIndex);
        
        if (ch.length < amount) {
            toReturn = ch.slice(0, ch.length)
        }
        else {
            toReturn = ch.slice(ch.length - 20, ch.length);
        }
        
        return {
            "isBase64Encoded": false,
            "statusCode": 200,
            "body": JSON.stringify(toReturn),
            headers: {
                amount: toReturn.length,
                startingKey: JSON.stringify( toReturn[toReturn.length - 1] )
            }
        }
        
    }
    else {
        return {
            "isBase64Encoded": false,
            "statusCode": 404,
            "body": "License key invalid"
        }
    }
}