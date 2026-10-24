
import React, { useState } from "react";
import axios from "axios";
import "./Mpesa.css";
import enjoy from "./Images/enjoy.png";

function Mpesa() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [loading, setLoading] = useState(false);

  const handlesubmit = async (e) => {
    e.preventDefault();

    setFeedback("");
    setLoading(true);

    try {
      // Send phone and amount to your Express backend
      const res = await axios.post(
        "http://localhost:3000/b2c",
        {
          phone,
          amount: Number(amount),
        }
      );

      if (res.data.success) {
        setFeedback(res.data.message);
         setFeedbackType("success");

        setTimeout(()=>{
        setFeedback("");
        },5000)
        console.log("B2C response:", res.data);
      }

       else {
        setFeedback(res.data.message || "The payment request could not be submitted." );
        setFeedbackType("error");

         setTimeout(()=>{
        setFeedback("");
        },5000)
      }

    } catch (error) {
      console.error(
        "B2C error:",
        error.response?.data || error.message
      );

      setFeedback( error.response?.data?.message || "Failed to connect to the server. Please try again.");
       setFeedbackType("error");

        setTimeout(()=>{
        setFeedback("");
        },5000)
        
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>M-Pesa Disbursement System</h1>
      <h2>Pay your employees at your comfort</h2>

      <form className="form" onSubmit={handlesubmit}>
    
        <img src={enjoy} alt="safaricom banner" />
        <input
          type="tel"
          name="phone"
          id="phone"
          placeholder="Employee's phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <input
          type="number"
          name="amount"
          id="amount"
          placeholder="Employee's salary (KSh)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          required
        />

        <button
          className="btn"
          type="submit"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Pay Employee"}
        </button>

       {feedback && (
       <p className={`feedback ${feedbackType}`}>
        {feedback}
       </p>
        )}
      </form>
    </div>
  );
}

export default Mpesa;