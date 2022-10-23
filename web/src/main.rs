use shared::{add_for_platform, cat_fact_async, Platform, PlatformError};
use web_sys::window;
use woothee::parser::Parser;
use yew::prelude::*;
use yew::use_effect_with_deps;

const API_URL: &str = "https://catfact.ninja/fact";

#[function_component(HelloWorld)]
fn hello_world() -> Html {
    struct WebPlatform;
    impl Platform for WebPlatform {
        fn get(&self) -> Result<String, PlatformError> {
            let navigator = window().unwrap().navigator();
            let agent = navigator.user_agent().unwrap_or_default();
            let parser = Parser::new();
            Ok(parser.parse(&agent).unwrap_or_default().name.to_string())
        }
    }
    let result = add_for_platform(1, 2, Box::new(WebPlatform {})).unwrap_or_default();

    let fact = use_state(String::new);
    {
        let fact = fact.clone();
        use_effect_with_deps(
            move |_| {
                wasm_bindgen_futures::spawn_local(async move {
                    gloo_net::http::Request::get(API_URL).send().unwrap();
                    fact.set(cat_fact_async().await);
                });
                || ()
            },
            (),
        );
    }
    html! {
        <>
            <section class="section title has-text-centered">
                <p>{result}</p>
            </section>
            <section class="section has-text-centered">
                <p>{(*fact).clone()}</p>
            </section>
        </>
    }
}

fn main() {
    yew::start_app::<HelloWorld>();
}
