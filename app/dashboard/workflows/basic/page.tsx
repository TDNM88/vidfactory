"use client";
import { useState } from "react";
import DashboardWorkflowBasic from "@/components/dashboardworkflow-basic";
import BasicWelcome from "@/components/basic-welcome";

export default function BasicWorkflowPage() {
  const [showForm, setShowForm] = useState(false);
  return showForm ? (
    <DashboardWorkflowBasic />
  ) : (
    <BasicWelcome onStart={() => setShowForm(true)} />
  );
}
