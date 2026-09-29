import {
  Button,
  Input,
  Label,
  TextField,
} from "@heroui/react";

import { Link } from "react-router-dom";
import "../css/register.css";

function Register() {
  return (
    <div className="register-page">
      <div className="register-card">

        <div className="register-header">
          <div className="register-logo">
            DD
          </div>

          <h1 className="register-title">
            Create Account
          </h1>

          <p className="register-subtitle">
            Join DormDash and start delivering.
          </p>
        </div>

        <div className="register-form">

          <TextField name="name" type="text">
            <Label>Name</Label>

            <Input
              className="register-input"
              placeholder="Enter your name"
            />
          </TextField>

          <TextField name="email" type="email">
            <Label>Email</Label>

            <Input
              className="register-input"
              placeholder="student@uafs.edu"
            />
          </TextField>

          <TextField name="password" type="password">
            <Label>Password</Label>

            <Input
              className="register-input"
              placeholder="Enter your password"
            />
          </TextField>

          <Button
            variant="primary"
            className="register-button"
          >
            Create Account
          </Button>

          <p className="register-login-text">
            Already have an account?{" "}

            <Link
              to="/login"
              className="register-login-link"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Register;