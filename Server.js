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

//app initialization
const app=express()

app.use(cors())
app.use(express.json())

//test the server if its up
app.get('/',(req,res)=>{
    res.send('<h1>Hellow from B2C MPESA </h1>')
})

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
     const {phone, amount}=req.body 

     const newphone=`254${phone.slice(1)}`
     const token=await generate_Token()
     // crypto to auto generate id for every request
    
     const cryptoID= crypto.randomUUID();

     const payload={
    OriginatorConversationID: cryptoID,
    InitiatorName: "testapi",
    SecurityCredential: "RC6E9WDxXR4b9X2c6z3gp0oC5Th ==",
    CommandID: "BusinessPayment",
    Amount: amount,
    PartyA: "600992",
    PartyB: newphone,
    Remarks: "remarked",
    QueueTimeOutURL: "https://mydomain.com/path", 
    ResultURL: "https://mydomain.com/path",
    Occassion: "ChristmasPay"
}

const response=await axios.post(`${baseUrl}/mpesa/b2c/v3/paymentrequest`,payload,
    {
        headers:{
            Authorization: `Bearer ${token}`,
            "Content-Type": "Application/json"
            },
   })  
     res.status(200).json({
      success: true,
      message: "B2C request submitted. Awaiting transaction result.",
      data: response.data,
    });    

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
  const result = req.body?.Result;

  if (!result) {
    return res.status(400).json({
      message: "Invalid callback payload",
    });
  }

  console.log("B2C result:", result);

  if (Number(result.ResultCode) === 0) {
    console.log("Payment completed:", result.TransactionID);
  } else {
    console.log("Payment failed:", result.ResultDesc);
  }

  // Acknowledge receipt of the callback.
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


//start the express server
app.listen(port,()=>{
    console.log(`app is running on http://localhost:${port}`)
})