
const express=require('express')
const axios=require('axios')
const cors =require('cors')
require('dotenv').config()
   // crypto to auto generate id for every request
     const crypto = require("crypto"); 

//import the env variables 

const port=process.env.PORT
const consummer_key=process.env.CONSUMMER_KEY
const consummer_secret=process.env.CONSUMMER_SECRET
const passkey=process.env.PASSKEY
const shortcode=process.env.SHORTCODE
const baseUrl=process.env.BASE_URL
const resultUrl = process.env.RESULT_URL;
const timeoutUrl = process.env.TIMEOUT_URL;


//app initialization
const app=express()

app.use(cors())
app.use(express.json())

//test the server if its up
app.get('/',(req,res)=>{
    res.send('<h1>Hellow from B2C MPESA </h1>')
})
 
     // payment-status store
    const paymentStatuses = new Map();

//function to generate access_token
const generate_Token= async()=>{
    const auth=Buffer.from(`${consummer_key}:${consummer_secret}`).toString("base64")
    
    const response=await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
            headers:{
                Authorization: `Basic ${auth}`
            }
        }
    )

    console.log( "ACCESS TOKEN :",response.data)
    return response.data.access_token;  

}

//generate_Token()

//Creating a b2c endpoint
app.post('/b2c',async(req,res)=>{



    try{
   const { phone, amount } = req.body;

   const newphone = phone.startsWith("254") ? phone  : `254${phone.slice(1)}`;

     const token=await generate_Token()

     // crypto to auto generate id for every request    
     const cryptoID= crypto.randomUUID();

     //Save the initial payment request
    paymentStatuses.set(cryptoID, {
    status: "PENDING",
    message: "Payment request submitted. Waiting for Safaricom..."
    });

     const payload={
    OriginatorConversationID: cryptoID,
    InitiatorName: "testapi",
    SecurityCredential: "RC6E9WDxXR4b9X2c6z3gp0oC5Th ==",
    CommandID: "BusinessPayment",
    Amount: amount,
    PartyA: "600992",
    PartyB: newphone,
    Remarks: "remarked",
    QueueTimeOutURL: timeoutUrl, 
    ResultURL: resultUrl,
    Occassion: "ChristmasPay"
}


console.log("QueueTimeOutURL:", payload.QueueTimeOutURL);
console.log("ResultURL:", payload.ResultURL);
console.log("Timeout URL type:", typeof payload.QueueTimeOutURL);

const response=await axios.post(`${baseUrl}/mpesa/b2c/v3/paymentrequest`,payload,
    {
        headers:{
            Authorization: `Bearer ${token}`,
            "Content-Type": "Application/json"
            },
   })  
     res.status(200).json({
      success: true,
      message: "Request submitted. Waiting for payment confirmation.",
      originatorConversationID: cryptoID,
      data: response.data,
    });   
    
     console.log('safaricom is::',response.data)
    }
    
    catch (error) {
    console.error(
      "B2C error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to submit B2C request.",
      error: error.response?.data || error.message,
    });
  }
})

//callback implimentation

app.post("/b2c/result", (req, res) => {
  console.log("B2C CALLBACK RECEIVED");

  const result = req.body?.Result;

  //status update
    const requestId = result.OriginatorConversationID;

    paymentStatuses.set(requestId, {
    status: Number(result.ResultCode) === 0 ? "SUCCESS" : "FAILED",
    message: result.ResultDesc,
    transactionId: result.TransactionID
});

  if (!result) {
    console.log("Invalid callback payload:");
    console.log(JSON.stringify(req.body, null, 2));

    return res.status(400).json({
      message: "Invalid callback payload",
    });
  }

  console.log("B2C RESULT:");
  console.log(JSON.stringify(result, null, 2));

  if (Number(result.ResultCode) === 0) {
    console.log("Payment completed successfully");
    console.log("Transaction ID:", result.TransactionID);
    console.log("Amount:", result.ResultParameters?.ResultParameter);
  } else {
    console.log("Payment failed");
    console.log("Reason:", result.ResultDesc);
  }

  return res.status(200).json({
    ResultCode: 0,
    ResultDesc: "Accepted",
  });
});

app.post("/b2c/timeout", (req, res) => {
  console.log("B2C timeout:", req.body);

  return res.status(200).json({
    ResultCode: 0,
    ResultDesc: "Accepted",
  });
});


// B2C timeout callback
app.post("/b2c/timeout", (req, res) => {
  console.log(
    "B2C TIMEOUT CALLBACK:",
    JSON.stringify(req.body, null, 2)
  );

  return res.status(200).json({
    ResultCode: 0,
    ResultDesc: "Accepted",
  });
});


app.get("/b2c/status/:id", (req, res) => {
  const payment = paymentStatuses.get(req.params.id);

  if (!payment) {
    return res.status(404).json({
      message: "Payment status is still pending"
    });
  }

  res.json(payment);
});


//start the express server
app.listen(port,()=>{
    console.log(`app is running on http://localhost:${port}`)
})



