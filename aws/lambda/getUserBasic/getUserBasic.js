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
        
        return {
            "isBase64Encoded": false,
            "statusCode": 200,
            "body": JSON.stringify(result.Item.analytics.basic)
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