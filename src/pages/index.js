import React from "react";

import { util, track } from "src/util";
import { store, useStateRef, useSessionStateRef } from "src/util/store";
import { useState } from "react";
import { useRef } from "react";
import { useEffect } from "react";
import Head from "next/head";
import Script from "next/script";
import { useCallback } from "react";
import _ from "lodash";
import MuiTextField from "src/components/MuiTextField.js";

/* NATIVE(imports) { */

/* } NATIVE */

import styles from "./index.module.css";

const Login = (props) => {
  const [usrn, setUsrn, usrnRef] = useStateRef();

  const [password, setPassword, passwordRef] = useStateRef();

  const valueRef = useRef();

  /* NATIVE(declarations) { */

  /* } NATIVE */

  const onUsrnChanged = useCallback(async (value) => {
    setUsrn(value);
  }, []);

  const onPasswordChanged = useCallback(async (value) => {
    setPassword(value);
  }, []);

  const login = useCallback(async () => {}, []);

  return (
    <>
      <Head>
        {(props.meta || []).map((m) =>
          m.name ? (
            <meta name={m.name} content={m.content} key={m.key || m.name} />
          ) : m.property == "title" ? (
            <>
              <title>{m.content || "Title"}</title>
              <meta
                property="og:title"
                content={m.content || "Title"}
                key="title"
              />
            </>
          ) : (
            <meta
              property={m.property}
              content={m.content}
              key={m.key || m.property}
            />
          ),
        )}
        {(props.headScripts || []).map((s, index) =>
          s.src ? (
            <script key={index} src={s.src} defer />
          ) : (
            <script key={s.id} id={s.id}>
              {s.code}
            </script>
          ),
        )}
        {(props.links || []).map((l) => (
          <link
            key={l.href}
            rel={l.rel}
            href={l.href}
            crossorigin={l.crossorigin}
            type={l.type}
            size={l.size}
          />
        ))}
      </Head>

      <div className={styles["login-main"]}>
        <input
          className={styles["login-username"]}
          onChange={_.throttle((e) => onUsrnChanged(e.target.value), 500)}
          placeholder="Type in here"
          value={usrn || ""}
        ></input>
        <input
          className={styles["login-password"]}
          onChange={_.throttle((e) => onPasswordChanged(e.target.value), 500)}
          placeholder="Type in here"
          value={password || ""}
        ></input>
        <MuiTextField
          className={styles["login-mui-text-field"]}
          placeholder={"Wow"}
        />
        <button className={styles["login-sub"]} onClick={login}>
          button
        </button>
      </div>
      {(props.scripts || []).map((s, index) =>
        s.src ? (
          <Script key={index} src={s.src} strategy={s.strategy} />
        ) : (
          <Script key={s.id} id={s.id} strategy={s.strategy}>
            {s.code}
          </Script>
        ),
      )}
    </>
  );
};

export default Login;
