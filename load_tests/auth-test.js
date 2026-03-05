import http from "k6/http";

const BASE_URL = "https://dragon-api.duckdns.org";
export const options = {
    vus: 10,
    duration: "10s",
};

export default function () {
    http.get(`${BASE_URL}/actuator/health`);
}