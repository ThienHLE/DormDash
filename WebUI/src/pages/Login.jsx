import {
  Button,
  Input,
  Label,
  TextField,
} from "@heroui/react";

import { Link } from "react-router-dom";
import "../css/login.css";

function Login() {
  return (
    <div className="login1-page">
      <div className="login1-card">

        <div className="login1-header">
          <div className="login1-logo">
            DD
          </div>

          <h1 className="login1-title">
            Welcome to DormDash
          </h1>

          <p className="login1-subtitle">
            Campus delivery, powered by students.
          </p>
        </div>

        <div className="login1-form">

          <TextField name="email" type="email">
            <Label>Email</Label>

            <Input
              className="login1-input"
              placeholder="student@uafs.edu"
            />
          </TextField>

          <TextField name="password" type="password">
            <Label>Password</Label>

            <Input
              className="login1-input"
              placeholder="Enter your password"
            />
          </TextField>

          <div className="login1-options">

            <label className="login1-remember">
              <input type="checkbox" />
              Remember me
            </label>

            <button className="login1-link">
              Forgot password?
            </button>

          </div>

          <Button
            variant="primary"
            className="login1-signin"
          >
            Sign In
          </Button>

          <p className="login1-signup-text">
            Don't have an account?{" "}

            <Link
              to="/register"
              className="login1-signup-link"
            >
              Create one
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Login;