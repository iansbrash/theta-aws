var AWS = require("aws-sdk");
AWS.config.update({
    region: "us-east-1",
});
var docClient = new AWS.DynamoDB.DocumentClient();
var axios = require('axios')

exports.handler = async function(event, context) {        
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Retrieve request parameters from the Lambda function input:
    var headers = event.headers;
        
    const params = {
        TableName: 'licenseKeys',
        Key:
        {
            "license": headers.license
        }
    }
    
    let result = await docClient.get(params).promise();
    
    if (result.Item !== undefined && result.Item !== null) {
        
        try {
            let token = 'ODYzNTE2OTQ1NzEzOTg3NjA0.YOoC0w.n_ZK4GvF0b49rUFghAQMxfs-7c0'
            let userInfo = await axios({
                method: 'get',
                url: `https://discord.com/api/users/${result.Item.discordId}`,
                headers: {
                    Authorization: `Bot ${token}`
                }
            })

            return {
                "isBase64Encoded": false,
                "statusCode": 200,
                "body": JSON.stringify(userInfo.data)
            }
        }
        catch (err) {
            return {
                "isBase64Encoded": false,
                "statusCode": 401,
                "body": JSON.stringify(err.data)
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