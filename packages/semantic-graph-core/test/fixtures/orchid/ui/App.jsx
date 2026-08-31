import { client } from "./client.js";
export function OrchidBoard() {
  return fetch("/api/orchids");
}
export function DynamicBoard(target) {
  return fetch(target);
}
const routes = <Route path="/orchids" element={<OrchidBoard />} />;
