# Vercel Deployment Guide

This document provides guidance for deploying the Recording Studio Tycoon application to Vercel.

**Status (2025-06-11):** User has confirmed Vercel project settings have been updated according to the recommendations below. The primary fix was changing the Build Command from `npm build` to `npm run build`.

## Build Configuration

It's crucial to ensure Vercel uses the correct commands to build and deploy the application.

### Build Command

The most common issue during Vercel builds for Node.js/npm projects is an incorrect build command.

*   **Problem:** Vercel defaults to `npm build` or similar, which might not be the script defined in your `package.json`.
*   **Symptom:** Build logs show an error like `Unknown command: "build"` followed by `Did you mean this? npm run build`.
*   **Solution:**
    1.  Go to your project on Vercel.
    2.  Navigate to **Settings** -> **General**.
    3.  Under **Build & Development Settings**, find the **Build Command** field.
    4.  Set this field to `npm run build`. If your project uses Vite directly and your `package.json` script is, for example, `"build": "vite build"`, then `npm run build` is still the correct Vercel command. Vercel will execute the `build` script defined in your `package.json`.

### Output Directory

Vercel also needs to know where your built application assets are located. For Vite projects, this is typically the `dist` directory.

*   **Setting:** In the same **Build & Development Settings** section on Vercel, ensure the **Output Directory** is set to `dist`.

### Node.js Version

Specify the Node.js version to ensure compatibility.

*   **Setting:** In the **Build & Development Settings**, set the **Node.js Version** to the one you are using for development (e.g., 18.x, 20.x). This can help prevent unexpected issues due to version mismatches.

## Environment Variables

If your application requires environment variables (e.g., API keys, Supabase URL/keys), make sure to configure them in your Vercel project settings:

*   Navigate to **Settings** -> **Environment Variables**.
*   Add your variables here. These will be securely injected into your build and runtime environments.

## Common Issues & Troubleshooting

*   **Case Sensitivity:** Vercel's build environment is typically Linux-based, which has a case-sensitive file system. Ensure all file imports in your code use the correct casing. Mismatches can lead to "module not found" errors during the Vercel build, even if the app runs locally on a case-insensitive OS (like macOS or Windows).
*   **Missing Dependencies:** Double-check that all necessary dependencies are listed in your `package.json` and not just installed globally or locally without being saved.
*   **Build Timeouts:** If your build process is very long, you might hit Vercel's build time limits. Optimize your build process if possible.
*   **Large Assets:** Be mindful of the
