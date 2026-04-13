use iced::widget::{button, column, text, container};
use iced::{Alignment, Element, Length};
use crate::{Message, App};

pub fn view_setup_screen(app: &App) -> Element<Message> {
    let content = column![
        text("Setup required!").size(30),
        button("Setup")
            .on_press(Message::StartSetup)
            .padding(10),
    ]
    .spacing(20)
    .align_x(Alignment::Center);

    container(content)
        .width(Length::Fill)
        .height(Length::Fill)
        .center_x(Length::Fill)
        .center_y(Length::Fill)
        .into()
}