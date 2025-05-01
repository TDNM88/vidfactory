"use client";
import { useState } from "react";
import DashboardWorkflowBasicPlus from "@/components/dashboardworkflow-basic-plus"; 
import BasicPlusWelcome from "@/components/basic-plus-welcome"; 

export default function BasicPlusWorkflowPage() {
  const [showForm, setShowForm] = useState(false);

  // Use the welcome screen initially
  return showForm ? (
    <DashboardWorkflowBasicPlus />
  ) : (
    <BasicPlusWelcome onStart={() => setShowForm(true)} />
  );
}
