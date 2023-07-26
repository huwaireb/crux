import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";

import init_core, { process_event, view } from "../shared/core";
import type { Event } from "shared_types/types/shared_types";
import {
  Request,
  ViewModel,
  EffectVariantRender,
  EventVariantReset,
  EventVariantIncrement,
  EventVariantDecrement,
} from "shared_types/types/shared_types";
import {
  BincodeDeserializer,
  BincodeSerializer,
} from "shared_types/bincode/mod";

const Home: NextPage = () => {
  const [state, setState] = useState(new ViewModel("0"));

  function dispatch(event: Event) {
    const serializer = new BincodeSerializer();
    event.serialize(serializer);
    const effects = process_event(serializer.getBytes());
    processEffects(effects);
  }

  async function processEffects(bytes: Uint8Array) {
    const requests = deserializeRequests(bytes);

    for (const { uuid: _, effect } of requests) {
      switch (effect.constructor) {
        case EffectVariantRender: {
          setState(deserializeView(view()));
          break;
        }
      }
    }
  }

  useEffect(
    () => {
      async function loadCore() {
        await init_core();

        // Initial event
        dispatch(new EventVariantReset());
      }

      loadCore();
    },
    /*once*/ []
  );

  return (
    <>
      <Head>
        <title>Next.js Counter</title>
      </Head>

      <main>
        <section className="box container has-text-centered m-5">
          <p className="is-size-5">{state.count}</p>
          <div className="buttons section is-centered">
            <button
              className="button is-primary is-danger"
              onClick={() => dispatch(new EventVariantReset())}
            >
              {"Reset"}
            </button>
            <button
              className="button is-primary is-success"
              onClick={() => dispatch(new EventVariantIncrement())}
            >
              {"Increment"}
            </button>
            <button
              className="button is-primary is-warning"
              onClick={() => dispatch(new EventVariantDecrement())}
            >
              {"Decrement"}
            </button>
          </div>
        </section>
      </main>
    </>
  );
};

function deserializeRequests(bytes: Uint8Array) {
  const deserializer = new BincodeDeserializer(bytes);
  const len = deserializer.deserializeLen();
  const requests: Request[] = [];
  for (let i = 0; i < len; i++) {
    const request = Request.deserialize(deserializer);
    requests.push(request);
  }
  return requests;
}

function deserializeView(bytes: Uint8Array) {
  return ViewModel.deserialize(new BincodeDeserializer(bytes));
}

export default Home;
