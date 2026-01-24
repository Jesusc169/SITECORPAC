import http from "k6/http";
import { check, sleep } from "k6";

/* =========================
   CONFIGURACIÓN DEL TEST
========================= */
export const options = {
  stages: [
    { duration: "20s", target: 50 },   // warm-up
    { duration: "30s", target: 200 },
    { duration: "30s", target: 500 },
    { duration: "30s", target: 1000 }, // stress real
    { duration: "20s", target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],        // <1% errores
    http_req_duration: ["p(95)<500"],      // 95% < 500ms
  },
};

/* =========================
   TEST
========================= */
export default function () {
  const res = http.get("http://localhost:3000/api/directorio");

  check(res, {
    "status 200": (r) => r.status === 200,
    "tiene body": (r) => r.body && r.body.length > 0,
    "response < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
