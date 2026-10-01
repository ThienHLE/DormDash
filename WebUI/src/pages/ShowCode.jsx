
import { signup } from "../api/API.js";

function showCode(){

    const code = "123456"; 

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

export default showCode