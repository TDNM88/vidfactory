"use client";
import { useState } from "react";
import DashboardWorkflowBasicPlus from '@/components/dashboardworkflow-basic-plus'
import BasicPlusWelcome from "@/components/basic-plus-welcome"; 
import { motion } from 'framer-motion';

export default function BasicPlusWorkflowPage() {
  const [showForm, setShowForm] = useState(false);
  
  return showForm ? (
    <DashboardWorkflowBasicPlus />
  ) : (
    <BasicPlusWelcome onStart={() => setShowForm(true)} />
  );
}
