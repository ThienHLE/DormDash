import {
  Button,
  Input,
  Label,
  TextField,
} from "@heroui/react";

import { Link } from "react-router-dom";

function Login() {
  return (
    <>
      {/* header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white">
          DD
        </div>

        <h1 className="text-3xl font-bold text-ink">
          Welcome to DormDash
        </h1>

        <p className="mt-2 text-muted">
          Campus delivery, powered by students.
        </p>
      </div>

      {/* form */}
      <div className="flex flex-col gap-5">
        <TextField name="email" type="email">
          <Label>Email</Label>
          <Input
            className="mt-2 w-full"
            placeholder="student@uafs.edu"
          />
        </TextField>

        <TextField name="password" type="password">
          <Label>Password</Label>
          <Input
            className="mt-2 w-full"
            placeholder="Enter your password"
          />
        </TextField>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-body">
            <input type="checkbox" />
            Remember me
          </label>

          <button className="cursor-pointer font-medium text-primary hover:underline">
            Forgot password?
          </button>
        </div>

        <Button
          variant="primary"
          className="w-full justify-center bg-primary text-white"
        >
          Sign In
        </Button>

        <p className="text-center text-sm text-muted">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </>
  );
}

export default Login;