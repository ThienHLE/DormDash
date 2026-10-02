import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { generateCode } from "../api/API.js";

function ShowCode(){
    const requested = useRef(false); 
    const {id} = useParams();
    const[code, setCode] = useState("");
    const[error, setError] = useState("");

    useEffect(() => {

      if(requested.current) return;
      requested.current = true; 
      generateCode(id)
      .then(setCode)
      .catch((err) => setError(err.message));
    }, [id]); 

     if (error) {
       return <p className="mt-10 text-center text-danger">{error}</p>;
     }

     if (!code) {
       return <p className="mt-10 text-center text-muted">Generating code...</p>;
     }

    return (
        <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col items-center justify-center gap-6 text-center">
      <div>
        <h1 className="text-3xl font-bold text-ink">Your confirmation code</h1>
        <p className="mt-2 text-muted">Give this code to your driver at drop-off</p>
      </div>

      <div className="flex gap-2 md:gap-3">
        {code.split("").map((digit, i) => (
          <div
            key={i}
            className="grid size-14 md:size-16 place-items-center rounded-xl border-2 border-primary bg-primary-light text-2xl font-bold text-primary"
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
    ); 

}

export default ShowCode;