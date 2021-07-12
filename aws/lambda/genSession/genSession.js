var AWS = require("aws-sdk");
AWS.config.update({
    region: "us-east-1",
});
var docClient = new AWS.DynamoDB.DocumentClient();

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
        if (result.Item.session === '') {
            // add session to dynamoDB

            let newSession = Math.floor(100000 + Math.random() * 900000) + 'a';

            console.log(newSession)

            const updateParams = {
                TableName: 'licenseKeys',
                Key:
                {
                    "license": headers.license
                },
                UpdateExpression: `set #sess = :x`,
                ExpressionAttributeNames: {
                    '#sess' : 'session'
                },
                ExpressionAttributeValues: {
                    ":x": newSession
                }
            }
            // const prom = new Promise(function(resolve, reject) {
            //         docClient.update(updateParams, function(err, data) {
            //         if (err) reject(err);
            //         else resolve({status: 200, body: newSession})
            //     });
            // });
            
            try {
                await docClient.update(updateParams).promise();
                return {
                    "isBase64Encoded": false,
                    "statusCode": 200,
                    "headers": { "session": newSession },
                    "body": newSession
                }
            }
            catch (err) {throw err; }
            

            //callback(null, `Generated session ${newSession}`); //, generateAllow('me', event.methodArn)
        }
        else {
            // callback("Session is already active");
            
            return {
                "isBase64Encoded": false,
                "statusCode": 401,
                "headers": {},
                "body": "Session already active"
            }
        }
    }
    else {
        return {
            "isBase64Encoded": false,
            "statusCode": 404,
            "headers": {},
            "body": "License key invalid"
        }
    }
}
     
// Help function to generate an IAM policy
var generatePolicy = function(principalId, effect, resource) {
    // Required output:
    var authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        var policyDocument = {};
        policyDocument.Version = '2012-10-17'; // default version
        policyDocument.Statement = [];
        var statementOne = {};
        statementOne.Action = 'execute-api:Invoke'; // default action
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = {
        "stringKey": "stringval",
        "numberKey": 123,
        "booleanKey": true
    };
    return authResponse;
}
     
var generateAllow = function(principalId, resource) {
    return generatePolicy(principalId, 'Allow', resource);
}
     
var generateDeny = function(principalId, resource) {
    return generatePolicy(principalId, 'Deny', resource);
}