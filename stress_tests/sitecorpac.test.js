import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 300 },
    { duration: "30s", target: 700 },
    { duration: "30s", target: 1000 },
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% < 500ms
    http_req_failed: ["rate<0.01"],   // < 1% errores
  },
};

export default function () {
  const url = "http://localhost:3000/api/ferias?page=1&limit=10";

  const res = http.get(url, {
    headers: {
      Accept: "application/json",
    },
  });

  check(res, {
    "status 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
    "has body": (r) => r.body && r.body.length > 0,
  });

  sleep(1);
}
