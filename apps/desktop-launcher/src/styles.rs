use iced::window;
use iced::window::icon;

pub fn window_settings() -> window::Settings {
    window::Settings {
        size: (600, 450).into(),
        position: window::Position::Centered,
        min_size: Some((600, 450).into()),
        resizable: true,
        // decorations: true,
        icon: load_icon(),
        ..window::Settings::default()
    }
}

fn load_icon() -> Option<icon::Icon> {
    let icon_bytes = include_bytes!("../assets/black_logo_transparent_background_small.png");

    image::load_from_memory(icon_bytes)
        .ok()
        .map(|img| {
            let rgba = img.to_rgba8();
            let (width, height) = rgba.dimensions();
            icon::from_rgba(rgba.into_raw(), width, height).unwrap()
        })
}