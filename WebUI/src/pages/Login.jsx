import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  Button,
  Input,
  Label,
  TextField,
} from "@heroui/react";

import { login } from "../api/API.js";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);

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
          Welcome to DormDash
        </h1>

        <p className="mt-2 text-muted">
          Campus delivery, powered by students.
        </p>
      </div>

      {/* form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
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

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-body">
            <input type="checkbox" />
            Remember me
          </label>

          <button
            type="button"
            className="cursor-pointer font-medium text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>

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
          {loading ? "Signing In..." : "Sign In"}
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
      </form>
    </>
  );
}

export default Login;