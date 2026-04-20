import "./globals.css";

export const metadata = {
  title: "Prescription Decoder",
  description:
    "Upload a prescription photo — understand each medicine in plain English and Hindi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
