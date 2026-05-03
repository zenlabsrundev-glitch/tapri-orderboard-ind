import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const createPDF = (filename: string, title: string, content: any[]) => {
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filename);
  doc.pipe(stream);

  // Title
  doc.fontSize(26).fillColor('#4a322d').text(title, { align: 'center' });
  doc.moveDown(2);

  content.forEach(item => {
    if (item.type === 'h1') {
      doc.fontSize(20).fillColor('#6b423a').text(item.text);
      doc.moveDown(0.5);
    } else if (item.type === 'h2') {
      doc.fontSize(16).fillColor('#8b5a4b').text(item.text);
      doc.moveDown(0.5);
    } else if (item.type === 'p') {
      doc.fontSize(12).fillColor('#333').text(item.text, { align: 'justify' });
      doc.moveDown(0.8);
    } else if (item.type === 'list') {
      item.items.forEach((li: string) => {
        doc.fontSize(12).fillColor('#333').text(`• ${li}`, { indent: 20 });
      });
      doc.moveDown(0.8);
    }
  });

  doc.end();
  return new Promise((resolve) => stream.on('finish', () => resolve(true)));
};

const userManualContent = [
  { type: 'h1', text: '1. Introduction' },
  { type: 'p', text: 'Tapri Orderboard is a modern, real-time order management system designed for campus tea stalls (Tapris). It streamlines the ordering process, tracks real-time queue status, and provides vendors with actionable insights through a clean dashboard.' },
  
  { type: 'h1', text: '2. User Roles' },
  { type: 'h2', text: 'Customer' },
  { type: 'p', text: 'Customers can browse the menu, select items (Chai, Snacks, Milk Drinks, Cold Beverages), and place orders with specific pickup times.' },
  { type: 'h2', text: 'Vendor (Admin)' },
  { type: 'p', text: 'Vendors manage the live order queue, update statuses, view daily revenue analytics, and receive instant notifications for new orders.' },

  { type: 'h1', text: '3. Core Features' },
  { type: 'list', items: [
    'Dynamic Menu: Interactive categories with real-time price calculation.',
    'Smart Suggestions: "Usually orders..." prompts based on common ordering patterns.',
    'Live Queue: Drag-and-drop or one-click status updates (Pending -> Preparing -> Ready).',
    'Real-time Notifications: Toast alerts and a persistent notification center for status changes.',
    'Analytics Dashboard: Visual revenue charts and key performance indicators (KPIs).'
  ]},

  { type: 'h1', text: '4. Step-by-Step Guide' },
  { type: 'h2', text: 'Placing an Order' },
  { type: 'p', text: '1. Select a category (e.g., Chai).\n2. Add items to the cart using the "+" button.\n3. Enter Group Name, Customer Name, and Phone Number.\n4. Select a pickup time (Urgent orders are highlighted in red).\n5. Click "Place Order".' },
  { type: 'h2', text: 'Managing Orders' },
  { type: 'p', text: '1. Navigate to the Live Order Queue.\n2. Click "Start Preparing" to move an order to the Preparing state.\n3. Click "Mark Ready" once the order is done.\n4. Click "Complete" to finish and archive the order.' }
];

const workflowContent = [
  { type: 'h1', text: '1. System Architecture' },
  { type: 'p', text: 'The system follows a full-stack JavaScript architecture using React for the frontend and Node.js (Express) for the backend, with Supabase providing a PostgreSQL persistence layer.' },
  
  { type: 'h1', text: '2. Frontend (React)' },
  { type: 'list', items: [
    'State Management: React Hooks (useState, useEffect, useCallback) and custom hooks (useOrders, useNotifications).',
    'Styling: Tailwind CSS with a custom "Tapri" theme (Saffron/Chai colors).',
    'Components: Modular architecture using Radix UI primitives and Lucide icons.',
    'Real-time: Polling for periodic synchronization with the backend.'
  ]},

  { type: 'h1', text: '3. Backend (Node.js/Express)' },
  { type: 'list', items: [
    'Layered Architecture: Controllers handle requests, Services manage business logic, and Repositories interact with the database.',
    'Persistence: Supabase (PostgreSQL) for storing orders and notification history.',
    'Communication: REST API with standard HTTP methods and polling for updates.',
    'Dependency Injection: Clean instantiation of services and repositories.'
  ]},

  { type: 'h1', text: '4. Data Flow: Order Lifecycle' },
  { type: 'p', text: 'When a user clicks "Place Order":' },
  { type: 'list', items: [
    '1. Frontend validates inputs and POSTs to /api/orders.',
    '2. Backend (OrderService) generates a unique ID and saves the order to Supabase.',
    '3. Backend (NotificationService) creates a persistent notification for the vendor.',
    '4. Frontend relies on polling to fetch the updated data for the Live Queue.'
  ]},

  { type: 'h1', text: '5. Real-time Synchronization' },
  { type: 'p', text: 'The system uses interval polling to keep all instances in sync. Connected clients periodically fetch data via REST APIs for orders and notifications.' }
];

async function main() {
  console.log('Generating PDFs...');
  await createPDF('Tapri_User_Manual.pdf', 'Tapri Orderboard - User Manual', userManualContent);
  console.log('Generated Tapri_User_Manual.pdf');
  await createPDF('Tapri_System_Workflow.pdf', 'Tapri Orderboard - System Workflow', workflowContent);
  console.log('Generated Tapri_System_Workflow.pdf');
}

main().catch(console.error);
