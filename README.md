# Image Gallery Application on AWS

## Overview

This project outlines the architecture and deployment process for an image gallery application hosted on Amazon Web Services (AWS) along whit my movieFlix Angular app hosted on AWS Instances and S3 bucket as well. The application allows users to upload, display, and manage images. The infrastructure is designed to be secure, scalable, and cost-effective, leveraging various AWS services.

## Architecture

The application utilizes the following AWS services:

* **Virtual Private Cloud (VPC):** A logically isolated section of the AWS Cloud where all resources are launched, ensuring network security and isolation.
    * Public Subnets: For internet-facing resources like the load balancer and bastion host.
    * Private Subnets: For backend resources such as the database and API instances, ensuring they are not directly exposed to the internet.
* **Internet Gateway (IG):** Enables communication between the VPC and the internet.
* **NAT Gateway:** Allows instances in the private subnets to connect to the internet for outbound traffic (e.g., software updates) without being directly accessible from the internet.
* **Route Tables:** Define the routes for network traffic within the VPC.
* **Security Groups:** Act as virtual firewalls, controlling inbound and outbound traffic at the instance level.
* **EC2 Instances:** Virtual servers used for:
    * **Database:** Storing application data in a private subnet for security.
    * **API:** Handling backend logic and serving data to the frontend, located in a private subnet.
    * **Bastion Host:** A secure entry point to access the private instances for management and troubleshooting, located in a public subnet.
    * **Web Servers (Auto Scaling Group):** Dynamically scaling the number of web server instances based on traffic to ensure high availability and performance.
* **Auto Scaling Group (ASG):** Automatically adjusts the number of web server instances based on defined metrics (e.g., CPU utilization).
* **Load Balancer:** Distributes incoming traffic evenly across the web server instances in the Auto Scaling Group, improving application availability and responsiveness.
* **S3 Buckets:** Scalable storage for:
    * **Static Website Hosting:** Hosting the frontend (Angular client) files.
    * **Image Storage:** Storing uploaded original and resized images.
* **Lambda Function:** Automates the resizing of uploaded images.
* **IAM Roles and Policies:** Securely manage permissions for different AWS resources to interact with each other.

## Deployment

The deployment process involves the following stages:

### 1. Network Infrastructure Setup

* Create a VPC with public and private subnets in your desired AWS region.
* Set up an Internet Gateway and attach it to the VPC.
* Configure NAT Gateways in the public subnets for outbound internet access from the private subnets.
* Define Route Tables to manage traffic flow within the VPC and to the internet.
* Establish Security Groups to control access to the different EC2 instances.

### 2. Instance Creation and Configuration

* Launch an EC2 instance for the database in a private subnet. Configure the necessary database software.
* Deploy an EC2 instance for the API in another private subnet. Install the backend application code (Node.js/Express).
* Set up a Bastion Host in a public subnet to allow secure SSH access to the private instances.
* Create an Auto Scaling Group with the desired configuration (instance type, AMI, scaling policies) for the web server instances.
* Configure a Load Balancer to distribute traffic to the instances within the Auto Scaling Group.

### 3. Storage Configuration

* **Create an S3 bucket for the static website:**
    ```bash
    aws s3 mb s3://<website_S3_bucket_name> --region <AWS_region>
    ```
* **Enable static website hosting on the bucket:**
    ```bash
    aws s3 website s3://<website_S3_bucket_name> --index-document index.html --error-document error.html
    ```
* **Create an S3 bucket for storing images.**
* **Configure permissions for the image bucket using IAM roles and policies.**

### 4. Application Deployment

* **Update the app's build process to deploy frontend files to the S3 bucket:**
    ```bash
    aws s3 sync <path_to_build_directory> s3://<website_S3_bucket_name> --acl public-read
    ```
    * Ensure your Angular project's build output (e.g., the `dist` directory) is specified as `<path_to_build_directory>`.

### 5. Application Code Updates

* **Backend (Node.js/Express API):**
    * Implement functionality to upload images to the S3 bucket.
    * Create API endpoints to:
        * List images.
        * Retrieve original images.
        * Retrieve thumbnails.
* **Frontend (Angular):**
    * Add a new page for the image gallery.
    * Implement features to:
        * Upload images.
        * Display the image gallery.
        * Retrieve original images.
* **Integrate AWS SDK and the Lambda function for image resizing.**

### 6. S3 Bucket Configuration (AWS Console)

* **Properties tab:** Enable Static Website Hosting and set `index.html` as the index document and `error.html` as the error document.
* **Permissions tab:** Set the Bucket Policy to allow public read access for the static website content. An example policy can be found in the project documentation.
