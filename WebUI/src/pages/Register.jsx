import {
  Button,
  Input,
  Label,
  TextField,
} from "@heroui/react";

import { Link } from "react-router-dom";

function Register() {
  return (
    <>
      {/* header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white">
          DD
        </div>

        <h1 className="text-3xl font-bold text-ink">
          Create Account
        </h1>

        <p className="mt-2 text-muted">
          Join DormDash and start delivering.
        </p>
      </div>

      {/* form */}
      <div className="flex flex-col gap-5">
        <TextField name="name" type="text">
          <Label>Name</Label>
          <Input
            className="mt-2 w-full"
            placeholder="Enter your name"
          />
        </TextField>

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

        <Button
          variant="primary"
          className="w-full justify-center bg-primary text-white"
        >
          Create Account
        </Button>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}

export default Register;