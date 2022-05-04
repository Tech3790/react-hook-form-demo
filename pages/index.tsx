import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import ReCAPTCHA from "react-google-recaptcha";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

interface FormData {
  email: string;
  password: string;
}

const client = new ApolloClient({
  uri: 'http://localhost:8080/graphql',
  cache: new InMemoryCache()
});

export default function Home() {
  const { register, handleSubmit, errors } = useForm<FormData>()
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverErrors, setServerErrors] = useState<Array<string>>([]);
  const reRef = useRef<ReCAPTCHA>();

  return (
    <form
      onSubmit={handleSubmit(async (formData) => {
        setSubmitting(true);
        setServerErrors([]);

        const token = await reRef.current.executeAsync();

        const signIn = (email: String, password: String) => {
          client
          .query({
            query: gql`
              query SignInUser {
                signInUser(username: "${email}", password: "${password}", captchaResponseToken: "${token}") {
                  accessToken,
                  userId
                }
              }
            `
          })
          .then(result => console.log("result is: " + JSON.stringify(result)))
          .catch(e => {
            console.log(e);
          })
        }

        reRef.current.reset();
      
        signIn(formData.email, formData.password)
        setSubmitting(false);
      })}
    >
      {/* token needs to be here  */}
      <ReCAPTCHA
        sitekey={""}
        size="invisible"
        ref={reRef}
      />

      {serverErrors && (
        <ul>
          {serverErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          ref={register({ required: "required" })}
        />
        {errors.email ? <div>{errors.email.message}</div> : null}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          ref={register({
            required: "required",
            minLength: {
              value: 8,
              message: "must be 8 chars",
            },
            validate: (value) => {
              return (
                [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].every((pattern) =>
                  pattern.test(value)
                ) || "must include lower, upper, number, and special chars"
              );
            },
          })}
        />
        {errors.password ? <div>{errors.password.message}</div> : null}
      </div>
      <div>
        <button type="submit" disabled={submitting}>
          SignIn
        </button>
      </div>
    </form>
  );
}
