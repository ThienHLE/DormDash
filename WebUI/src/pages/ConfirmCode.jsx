import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, InputOTP, REGEXP_ONLY_DIGITS } from "@heroui/react";
import { confirmCode } from "../api/API.js";

const CODE_LENGTH = 6;

const slotClass = `
  size-12 sm:size-14 md:size-16 text-2xl font-bold
  rounded-xl border-2 border-border bg-surface
  transition-transform duration-150
  data-[active=true]:scale-110 data-[active=true]:border-primary
  data-[filled=true]:border-primary
  data-[invalid=true]:border-danger
`;

function ConfirmCode(){
  const { id } = useParams(); // deliveryId from the URL
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); 
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e?.preventDefault();
    if (code.length < CODE_LENGTH || status === "loading") return;

    setStatus("loading");
    try {
      await confirmCode(id, code);
      setStatus("success");
    } catch (err) {
      if (err.status === 409) {
        setStatus("success");
        return;
      }
      setErrorMsg(err.message);
      setStatus("error");
      setCode(""); // clear squares for a retry
    }
  }

  if (status === "success") {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col items-center justify-center gap-4 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-success/10 text-3xl text-success">✓</div>
        <h1 className="text-3xl font-bold text-ink">Delivery confirmed!</h1>
        <p className="text-muted">Thanks for delivering.</p>
        <Link to="/dashboard" className="font-medium text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col items-center justify-center gap-6 text-center"
    >
      <div>
        <h1 className="text-3xl font-bold text-ink">Enter confirmation code</h1>
        <p className="mt-2 text-muted">Ask the recipient for their {CODE_LENGTH}-digit code</p>
      </div>

      <InputOTP
        maxLength={CODE_LENGTH}
        pattern={REGEXP_ONLY_DIGITS}
        value={code}
        onChange={(value) => {
          setCode(value);
          if (status === "error") setStatus("idle"); // clear red once they type again
        }}
        isInvalid={status === "error"}
        autoFocus
      >
        <InputOTP.Group className="gap-2 md:gap-3">
          {Array.from({ length: CODE_LENGTH }, (_, i) => (
            <InputOTP.Slot key={i} index={i} className={slotClass} />
          ))}
        </InputOTP.Group>
      </InputOTP>

      {status === "error" && <p className="text-sm text-danger">{errorMsg}</p>}

      <Button
        type="submit"
        variant="primary"
        isDisabled={code.length < CODE_LENGTH || status === "loading"}
        className="w-full bg-primary text-white"
      >
        {status === "loading" ? "Checking..." : "Confirm delivery"}
      </Button>
    </form>
  );
}

export default ConfirmCode;



