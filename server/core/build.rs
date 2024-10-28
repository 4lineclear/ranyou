fn main() {
    println!("cargo::rerun-if-changed=../../.env");
    dotenvy::from_path("../../.env").expect("unable to open .env");
    for (var, value) in dotenvy::vars() {
        println!("cargo::rustc-env={var}={value}");
    }
}
