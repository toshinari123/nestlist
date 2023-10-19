use rocket::http::{Status, Method, Header};
use rocket::{Request, Response};
use rocket::fairing::{Fairing, Info, Kind};

pub struct Cors;

#[rocket::async_trait]
impl Fairing for Cors {
    fn info(&self) -> Info {
        Info {
            name: "Adds CORS headers to responses",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        if request.method() == Method::Options {
            response.set_status(Status::NoContent);
            response.set_header(Header::new(
                "Access-Control-Allow-Methods",
                "GET, PUT",
            ));
            let h = "Accept, Accept-Encoding, Accept-Language, Connection, Content-Type, Host, Origin, Referer, Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, Sec-Ch-Ua, Sec-Ch-Ua-Mobile, Sec-Ch-Ua-Platform, User-Agent";
            response.set_header(Header::new("Access-Control-Allow-Headers", h));
        }
        response.set_header(Header::new("Access-Control-Allow-Origin", "https://nestspace.net"));
        if cfg!(feature = "local") {
            response.set_header(Header::new("Access-Control-Allow-Origin", "https://localhost:3000"));
        }
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }   
}
