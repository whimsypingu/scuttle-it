fn main() {
    if std::env::var("CARGO_CFG_TARGET_OS").unwrap() == "windows" {
        let mut res = winresource::WindowsResource::new();

        //this must be a .ico file
        res.set_icon("assets/logo_transparent_background.ico");

        res.set("ProductName", "Scuttle");
        res.set("FileDescription", "Scuttle");
        res.compile().unwrap();
    }
}