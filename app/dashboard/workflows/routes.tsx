import { createBrowserRouter } from 'react-router-dom';
import WorkflowLayout from './layout';
import BasicWorkflowPage from './basic/page';
import PremiumWorkflow from './premium/PremiumWorkflow';
import BasicPlusWorkflowPage from './basic-plus/page';

interface WorkflowRoute {
  path: string;
  name: string;
  description: string;
  icon: string;
  component: any;
  badge: string;
}

export const workflowRoutes: WorkflowRoute[] = [
  {
    path: "basic",
    name: "Basic",
    description: "Tạo video nhanh chóng với hình ảnh AI và tùy chọn cơ bản.",
    icon: "⚡️",
    component: BasicWorkflowPage,
    badge: "Phổ biến",
  },
  {
    path: "basic-plus",
    name: "Basic+",
    description: "Sử dụng video stock từ Pexels thay cho ảnh AI.",
    icon: "🎬",
    component: BasicPlusWorkflowPage,
    badge: "Mới",
  },
  {
    path: "premium",
    name: "Premium",
    description: "",
    icon: "",
    component: PremiumWorkflow,
    badge: "",
  }
];

// Only create the browser router on the client side
export const getRoutes = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Create browser router only on the client side
  return createBrowserRouter([
    {
      path: '/workflows',
      element: <WorkflowLayout />,
      children: workflowRoutes.map(route => ({
        path: route.path,
        element: <route.component />
      }))
    }
  ]);
};

// This is a placeholder for SSR
export const routes = null;