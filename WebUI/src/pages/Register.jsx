import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  Button,
  Input,
  Label,
  TextField,
} from "@heroui/react";

import { signup } from "../api/API.js";

function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signup({
        firstName,
        lastName,
        email,
        password,
      });

      navigate("/");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

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
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        <TextField name="firstName" type="text">
          <Label>First Name</Label>
          <Input
            className="mt-2 w-full"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
        </TextField>

        <TextField name="lastName" type="text">
          <Label>Last Name</Label>
          <Input
            className="mt-2 w-full"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </TextField>

        <TextField name="email" type="email">
          <Label>Email</Label>
          <Input
            className="mt-2 w-full"
            placeholder="student@uafs.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </TextField>

        <TextField name="password" type="password">
          <Label>Password</Label>
          <Input
            className="mt-2 w-full"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </TextField>

        {error && (
          <p className="text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full justify-center bg-primary text-white"
          isDisabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
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
      </form>
    </>
  );
}

export default Register;