import "dotenv/config";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const employees = [
  { id: "EMP-001", name: "Olivia Rhye", role: "Product Designer", department: "Design", status: "Active" },
  { id: "EMP-002", name: "Phoenix Baker", role: "Engineering Lead", department: "Engineering", status: "Active" },
  { id: "EMP-003", name: "Lana Steiner", role: "Product Manager", department: "Product", status: "On leave" },
];
const leaveRequests = [
  { id: 1, employee: "Lana Steiner", type: "Annual leave", dates: "Sep 24 – Sep 27, 2024", days: 4, status: "Pending" },
  { id: 2, employee: "Demi Wilkinson", type: "Sick leave", dates: "Sep 19, 2024", days: 1, status: "Pending" },
];

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "StaffSync API" }));
app.post("/api/auth/login", (req, res) => {
  const { email, role = "HR manager" } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });
  const token = jwt.sign({ email, role }, process.env.JWT_SECRET || "staffsync-development-secret", { expiresIn: "8h" });
  res.json({ token, user: { name: "Olivia Rhye", email, role } });
});
app.get("/api/employees", (_req, res) => res.json(employees));
app.get("/api/leave-requests", (_req, res) => res.json(leaveRequests));
app.patch("/api/leave-requests/:id", (req, res) => {
  const request = leaveRequests.find((item) => item.id === Number(req.params.id));
  if (!request) return res.status(404).json({ message: "Leave request not found." });
  if (!["Approved", "Declined"].includes(req.body.status)) return res.status(400).json({ message: "Status must be Approved or Declined." });
  request.status = req.body.status;
  res.json(request);
});
app.get("/api/announcements", (_req, res) => res.json([
  { title: "The company offsite is coming up", date: "Sep 28, 2024", tag: "Company news" },
  { title: "New learning & development resources", date: "Sep 16, 2024", tag: "Resources" },
]));

app.listen(port, () => console.log(`StaffSync API listening on http://localhost:${port}`));
