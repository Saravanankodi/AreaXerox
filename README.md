# order my xerox 

You are a Senior Product Designer, Senior UX Designer, Senior UI Designer, Senior Frontend Architect, and Senior Full-Stack Developer.

Your task is to design and build a complete, production-quality web application called:

ORDER MY XEROX

IMPORTANT:

Do not generate a generic SaaS dashboard or a student-project UI.

This must feel like a real, modern, startup-ready digital product that users can easily understand without instructions.

UX IS THE HIGHEST PRIORITY.

Every action should be obvious.

Every screen should have a clear purpose.

The order process should require minimum cognitive effort.

The user should always understand:

- What they are doing

- What happens next

- What information is required

- How much they need to pay

- What their current order status is

====================================================

1. PRIMARY DESIGN REFERENCE

====================================================

Use the website:

https://ordermyxerox.com/

as the PRIMARY CUSTOMER-SIDE UX and visual reference.

IMPORTANT:

Study and closely follow the overall user experience, simplicity, layout hierarchy, navigation approach, spacing rhythm, service ordering structure, visual familiarity, and ease of use of the reference.

However:

DO NOT create a pixel-for-pixel copy.

DO NOT copy branding, copyrighted graphics, or exact assets.

Create an original implementation with the same general usability philosophy.

The customer experience should feel familiar to users of the reference website.

The interface should prioritize:

- Simplicity

- Clear service selection

- Easy ordering

- Minimal confusion

- Familiar navigation

- Fast document upload

- Easy customization

- Clear payment information

- Clear order tracking

====================================================

2. TECHNOLOGY STACK

====================================================

Build using:

Next.js

TypeScript

Tailwind CSS

Use:

React

Next.js App Router

TypeScript

Tailwind CSS

shadcn/ui where appropriate

Lucide icons

Use reusable components.

Do not create one huge component.

Follow a clean feature-based architecture.

Suggested structure:

src/

  app/

    (customer)/

    shop/

  components/

    shared/

    customer/

    shopkeeper/

  features/

    orders/

    documents/

    print-services/

    payments/

    delivery/

    shops/

    users/

  hooks/

  lib/

  types/

====================================================

3. PRODUCT CONCEPT

====================================================

Order My Xerox is a two-sided platform.

There are two major users:

1. CUSTOMER

2. SHOPKEEPER

CUSTOMER:

Customers can:

- Upload documents

- Select a print shop

- See only printing options enabled by that shop

- Customize documents

- Select paper type

- Select print type

- Select print side

- Select copies

- Select page range

- Select orientation

- Select binding

- Select additional services

- Select Pickup or Delivery

- Select a payment method

- Pay the full amount

- Pay Advance

- Pay at Pickup

- Pay Cash on Delivery

- Track orders

- View payment status

- View delivery or pickup status

SHOPKEEPER:

Shopkeepers can:

- Receive customer orders

- Accept or reject orders

- Update order status

- Configure printing services

- Enable and disable print options

- Configure paper types

- Set prices

- Configure delivery

- Configure payment methods

- Configure Pay Advance rules

- Collect remaining balance

- Mark payment as fully paid

====================================================

4. FINAL CUSTOMER PAGES

====================================================

THE CUSTOMER SIDE MUST HAVE ONLY THESE MAIN PAGES:

1. Home

2. Order My Xerox

3. My Orders

4. Profile

5. Settings

6. Support

Do not create unnecessary marketplace pages.

Do not create separate:

- Books page

- Stationery page

- Kits page

- Analytics page

- Separate order tracking page

Order tracking should exist inside:

My Orders

→ Order Details

====================================================

5. FINAL SHOPKEEPER PAGES

====================================================

The shopkeeper platform should have:

1. Dashboard

2. Orders

3. Print Services

4. Shop Profile

5. Settings

The most important shopkeeper pages are:

ORDERS

and

PRINT SERVICES

====================================================

6. GLOBAL DESIGN SYSTEM

====================================================

Create a professional and reusable design system.

COLORS:

Primary:

#2563EB

Primary Hover:

#1D4ED8

Primary Light:

#EFF6FF

Background:

#F8FAFC

Surface:

#FFFFFF

Secondary Surface:

#F1F5F9

Primary Text:

#0F172A

Secondary Text:

#64748B

Muted:

#94A3B8

Border:

#E2E8F0

Success:

#10B981

Warning:

#F59E0B

Error:

#EF4444

TYPOGRAPHY:

Use Geist or Inter.

Hero Heading:

64px

Bold

Page Heading:

40px

Bold

Section Heading:

32px

Bold

Card Heading:

20px

SemiBold

Body:

16px

Small:

14px

Caption:

12px

SPACING:

Use an 8px spacing system.

4

8

12

16

20

24

32

40

48

64

80

96

120

Desktop maximum width:

1280px

Desktop horizontal padding:

32px

BORDER RADIUS:

Small:

8px

Medium:

12px

Large:

16px

Extra Large:

24px

Buttons:

8px to 12px

Cards:

12px to 16px

VISUAL STYLE:

Premium

Modern

Minimal

Clean

Friendly

Trustworthy

Easy to understand

Avoid:

Excessive gradients

Heavy shadows

Excessive glassmorphism

Overly rounded UI

Too many colors

Cluttered dashboards

Complex interactions

====================================================

7. CUSTOMER NAVIGATION

====================================================

DESKTOP NAVIGATION:

Logo

Home

Order My Xerox

My Orders

Support

Right side:

Profile / Login

Primary CTA:

Order Now

MOBILE NAVIGATION:

Use a bottom navigation.

Home

Order

My Orders

Profile

Settings and Support should be accessible through Profile.

====================================================

8. CUSTOMER HOME PAGE

====================================================

The home page should closely follow the simplicity and user familiarity of the reference website.

NAVIGATION:

Clean and minimal.

HERO SECTION:

Headline:

Print Smarter.

Skip the Queue.

Supporting text:

Upload your documents, customize your printing, and get your order ready before you arrive.

Primary CTA:

Order My Xerox

Secondary CTA:

How It Works

The hero should have an attractive product interface visual.

Do not use generic stock photography.

Show a realistic UI preview with:

Document upload

Print configuration

Order status

QUICK SERVICES:

Highlight the main service:

Order My Xerox

Show simple supporting service indicators such as:

Black & White Printing

Colour Printing

Binding

Lamination

Document Delivery

HOW IT WORKS:

Step 1:

Upload Document

Step 2:

Customize Printing

Step 3:

Choose Shop

Step 4:

Pickup or Delivery

BENEFITS:

Save Time

Skip the Queue

Transparent Pricing

Secure Documents

Track Your Order

Pickup or Delivery

NEARBY SHOPS:

Show modern shop cards.

Each card:

Shop Name

Rating

Distance

Preparation Time

Starting Price

Pickup Available

Delivery Available

Example:

Sri Digital Xerox

4.8 Rating

1.2 km Away

Ready in 20 minutes

Starting from ₹2/page

Badges:

Pickup

Delivery

CTA:

View Shop

FINAL CTA:

Ready to Skip the Queue?

Upload your document and place your order in minutes.

CTA:

Order My Xerox

====================================================

9. ORDER MY XEROX PAGE

====================================================

This is the most important customer experience.

Create a highly intuitive multi-step order flow.

Do not overwhelm users.

Show progress clearly.

Recommended steps:

1. Upload Document

2. Choose Shop

3. Customize Print

4. Pickup or Delivery

5. Payment

6. Review & Place Order

On desktop:

Main content on the left.

Sticky Order Summary on the right.

On mobile:

The summary should be collapsible and always accessible.

====================================================

10. STEP 1: UPLOAD DOCUMENT

====================================================

Create a large drag-and-drop upload zone.

Text:

Drag and drop your document here

or

Browse Files

Supported:

PDF

DOC

DOCX

After upload show:

File icon

File name

Number of pages

File size

Remove button

Example:

Assignment.pdf

15 Pages

2.4 MB

Allow multiple documents if appropriate.

Show upload progress.

Show success feedback.

====================================================

11. STEP 2: CHOOSE SHOP

====================================================

Display nearby available print shops.

Each card should show:

Shop Name

Rating

Distance

Preparation Time

Starting Price

Pickup Available

Delivery Available

Example:

Sri Digital Xerox

4.8

1.2 km

Ready in 20 minutes

₹2/page

Actions:

Select Shop

The selected shop should clearly show:

Selected

The shop selection is extremely important.

Once a shop is selected:

Load that shop's enabled print services dynamically.

====================================================

12. DYNAMIC SHOP-BASED PRINT CONFIGURATION

====================================================

IMPORTANT CORE SYSTEM:

Customer print customization must NOT be hardcoded.

The available options depend on the selected shop.

Flow:

Shopkeeper Configuration

↓

Database

↓

Selected Shop

↓

Customer Order Page

↓

Only Enabled Options Are Displayed

For example:

If Shop A enables:

A4

A3

Bond Sheet

Then the customer sees:

A4

A3

Bond Sheet

If Photo Sheet is disabled:

Do not show Photo Sheet.

This applies to all printing services.

====================================================

13. STEP 3: CUSTOMIZE PRINT

====================================================

Show only options enabled by the selected shop.

PAPER TYPE:

Examples:

A4

A3

Bond Sheet

Photo Sheet

Glossy Paper

Matte Paper

PRINT TYPE:

Black & White

Colour

PRINT SIDE:

Single Side

Double Side

COPIES:

Minus button

Quantity

Plus button

PAGE RANGE:

All Pages

Custom Range

ORIENTATION:

Portrait

Landscape

BINDING:

None

Spiral Binding

Soft Binding

Hard Binding

Show only enabled options.

ADDITIONAL SERVICES:

Lamination

Stapling

Show only enabled services.

PRICE:

Calculate dynamically.

The customer should always understand why the price changes.

====================================================

14. ORDER SUMMARY

====================================================

Create a persistent order summary.

Show:

Documents

Pages

Paper Type

Print Type

Print Side

Copies

Binding

Additional Services

Shop

Fulfillment Method

PRICE BREAKDOWN:

Printing

Additional Services

Delivery Fee

Discount

Total

If the user changes options:

Update price smoothly.

Do not hide important pricing.

====================================================

15. STEP 4: PICKUP OR DELIVERY

====================================================

Create two large selectable cards.

OPTION 1:

Pickup from Shop

Description:

Collect your completed order directly from the selected shop.

Show:

Shop address

Estimated ready time

Benefit:

No delivery charge

OPTION 2:

Home Delivery

Description:

Get your printed documents delivered to your selected address.

Show:

Estimated delivery time

Delivery fee

If Delivery is selected:

Show:

Saved addresses

Add New Address

Address fields:

Name

Phone

Door / House Number

Street

Area

City

Pincode

Allow:

Select Address

Add Address

Edit Address

Delete Address

Only show Delivery if the selected shop has enabled delivery.

====================================================

16. PAYMENT SYSTEM

====================================================

Create the following customer payment options.

1. Pay Full Amount

Description:

Pay the entire amount now.

2. Pay Advance

IMPORTANT:

Use exactly this customer-facing label:

Pay Advance

Description:

Pay a portion now and pay the remaining balance at pickup or delivery.

3. Cash at Pickup

Show only for Pickup orders.

4. Cash on Delivery

Show only for Delivery orders.

====================================================

17. PAY ADVANCE

====================================================

This is an important product feature.

Example:

Order Total:

₹130

Advance:

₹50

Balance:

₹80

For Pickup:

Pay ₹50 now.

Pay ₹80 at Pickup.

For Delivery:

Pay ₹50 now.

Pay ₹80 on Delivery.

The button should dynamically say:

Pay ₹50 & Place Order

PAYMENT SUMMARY:

Order Total

₹130

Advance Paid

₹50

Balance Remaining

₹80

Payment Due:

At Pickup

or

On Delivery

The shopkeeper controls whether Pay Advance is available.

The shopkeeper also controls:

Fixed Advance Amount

or

Percentage Advance

Example:

Fixed:

₹50

Percentage:

30%

The system should calculate automatically.

====================================================

18. PAYMENT STATUS

====================================================

Payment status must be separate from order status.

PAYMENT STATUS:

Unpaid

Partially Paid

Fully Paid

Failed

Refunded

Example:

Order Status:

Out for Delivery

Payment Status:

Partially Paid

₹50 Paid

₹80 Remaining

====================================================

19. REVIEW & PLACE ORDER

====================================================

Before placing the order, show a clear review screen.

Sections:

Documents

Print Configuration

Selected Shop

Pickup / Delivery

Address

Payment

Price Breakdown

Each section should have:

Edit

Show:

Order Total

Amount Paid Now

Remaining Balance

When Remaining Balance Is Due

Primary CTA:

Place Order

or

Pay ₹X & Place Order

depending on payment method.

====================================================

20. MY ORDERS PAGE

====================================================

Create an easy-to-understand orders page.

Tabs:

All

Processing

Ready

Completed

Cancelled

Each order card:

Order ID

Document Name

Shop Name

Order Date

Total Amount

Fulfillment:

Pickup

or

Delivery

Order Status

Payment Status

Example:

#OMX-1024

Assignment.pdf

Sri Digital Xerox

🚚 Out for Delivery

Payment:

₹50 Paid

₹80 Remaining

Pay on Delivery

CTA:

View Order Details

====================================================

21. ORDER DETAILS AND TRACKING

====================================================

Do not create a separate tracking page.

Tracking exists inside:

My Orders

→ View Order Details

Show ORDER STATUS TIMELINE.

PICKUP ORDER FLOW:

Order Placed

Shop Accepted

Printing

Finishing

Ready for Pickup

Completed

DELIVERY ORDER FLOW:

Order Placed

Shop Accepted

Printing

Finishing

Ready for Delivery

Out for Delivery

Delivered

Clearly distinguish:

Completed

Current

Upcoming

Show timestamps where appropriate.

PAYMENT CARD:

Order Total

Advance Paid

Remaining Balance

Payment Due

Payment Status

For Delivery:

Pay remaining amount to delivery person.

For Pickup:

Pay remaining amount at shop.

====================================================

22. PROFILE PAGE

====================================================

Create a clean profile page.

Show:

Profile Photo

Name

Email

Phone

Quick actions:

Edit Profile

Sections:

Personal Information

Saved Addresses

Payment Preferences

Show saved addresses.

Allow:

Add

Edit

Delete

====================================================

23. SETTINGS PAGE

====================================================

Sections:

ACCOUNT

Personal Information

Password

Security

PREFERENCES

Notifications

Language

Theme

DANGER ZONE

Delete Account

====================================================

24. SUPPORT PAGE

====================================================

Create a simple and friendly support experience.

Heading:

How can we help you?

Search bar.

Support categories:

Order Issues

Payment Issues

Document Upload Issues

Delivery Issues

Refund Issues

Provide:

Raise Support Ticket

Support Ticket Form:

Subject

Order ID optional

Category

Description

Attachment optional

Submit button.

====================================================

25. SHOPKEEPER PLATFORM

====================================================

Create a separate professional shopkeeper interface.

The shopkeeper platform should prioritize:

Desktop

Tablet

Use a sidebar.

Pages:

Dashboard

Orders

Print Services

Shop Profile

Settings

====================================================

26. SHOPKEEPER DASHBOARD

====================================================

Create a simple, useful dashboard.

Top statistics:

Today's Orders

Orders Processing

Ready Orders

Today's Revenue

Show:

Recent Orders

Order Status Overview

Quick Actions

Examples:

View New Orders

Configure Print Services

Manage Delivery

Keep analytics simple.

Do not overload the dashboard.

====================================================

27. SHOPKEEPER ORDERS PAGE

====================================================

This is one of the most important pages.

The shopkeeper sees all received customer orders.

Tabs:

All

New

Accepted

Printing

Ready

Out for Delivery

Completed

Rejected

Filters:

All Fulfillment

Pickup

Delivery

Payment:

All Payments

Fully Paid

Partially Paid

Payment Pending

Each order should display:

Order ID

Customer Name

Document Name

Number of Pages

Paper Type

Print Type

Print Side

Copies

Binding

Additional Services

Order Total

Fulfillment Method

Payment Method

Payment Status

Current Order Status

Order Date and Time

Example:

#OMX-1024

Customer:

Tamil

Document:

Assignment.pdf

A4

Black & White

Double Side

15 Pages

2 Copies

Spiral Binding

Total:

₹130

Fulfillment:

🚚 Delivery

Payment:

Pay Advance

Advance Received:

₹50

Balance:

₹80

Order Status:

NEW

Actions:

Reject

Accept Order

====================================================

28. SHOPKEEPER ORDER PROCESSING

====================================================

Shopkeeper should not randomly select any status.

Use logical status progression.

PICKUP:

NEW

↓

ACCEPTED

↓

PRINTING

↓

FINISHING

↓

READY FOR PICKUP

↓

COMPLETED

DELIVERY:

NEW

↓

ACCEPTED

↓

PRINTING

↓

FINISHING

↓

READY FOR DELIVERY

↓

OUT FOR DELIVERY

↓

DELIVERED

REJECTION:

NEW

↓

REJECTED

Provide contextual buttons.

Example:

Current:

NEW

Actions:

Reject

Accept Order

After acceptance:

Current:

ACCEPTED

Action:

Start Printing

After printing:

Current:

PRINTING

Action:

Mark as Finishing

Continue logically.

====================================================

29. CUSTOMER STATUS SYNCHRONIZATION

====================================================

The customer must receive the status update.

Flow:

Customer Places Order

↓

Shopkeeper Receives Order

↓

Shopkeeper Updates Status

↓

Database Updates

↓

Customer My Orders Updates

↓

Customer Sees Updated Timeline

Example:

Shopkeeper:

Mark as Out for Delivery

Customer:

🚚 Your order is out for delivery.

This must be reflected consistently throughout the application.

====================================================

30. SHOPKEEPER PAYMENT MANAGEMENT

====================================================

Each order has a Payment Details section.

Show:

Order Total

Payment Method

Amount Paid

Balance Remaining

Collection Method

Payment Status

Example:

Order Total:

₹130

Payment Method:

Pay Advance

Advance Received:

₹50

Balance:

₹80

Collection:

At Delivery

Payment Status:

Partially Paid

When the customer pays the remaining amount:

Shopkeeper action:

Mark Balance as Paid

Open confirmation:

Remaining Amount:

₹80

Payment Method:

Cash

UPI

Card

Confirm Payment

After confirmation:

Payment Status:

Fully Paid

₹130 / ₹130 Paid

====================================================

31. SHOPKEEPER PRINT SERVICES

====================================================

This is a major feature.

The shopkeeper controls what customers can select.

Create a page:

Print Services

Subtitle:

Configure printing options, availability and pricing for your customers.

====================================================

32. PAPER TYPES

====================================================

Allow enable and disable.

Examples:

A4 Paper

A3 Paper

Bond Sheet

Photo Sheet

Glossy Paper

Matte Paper

UI:

A4 Paper

Available

Toggle ON/OFF

Configure

When Configure is clicked:

Show configuration panel.

====================================================

33. PAPER CONFIGURATION

====================================================

Example:

Configure A4 Paper

Availability:

ON/OFF

Black & White:

Enabled

Price Per Page:

₹2

Colour:

Enabled

Price Per Page:

₹10

Supported Print Sides:

Single Side

Double Side

Save Changes

The same system applies to:

A3

Bond Sheet

Photo Sheet

Other paper types

====================================================

34. PRINT SERVICES CONFIGURATION

====================================================

PRINT TYPE:

Black & White

Enable / Disable

Colour

Enable / Disable

PRINT SIDES:

Single Side

Enable / Disable

Double Side

Enable / Disable

ORIENTATION:

Portrait

Landscape

Enable / Disable

BINDING:

Spiral

Soft Binding

Hard Binding

Enable / Disable each.

ADDITIONAL SERVICES:

Lamination

Stapling

Enable / Disable each.

Each configurable service should support pricing where applicable.

====================================================

35. DYNAMIC CUSTOMER OPTIONS

====================================================

IMPORTANT:

If the shopkeeper disables an option:

The customer must NOT see it.

Example:

Shopkeeper:

Photo Sheet OFF

Customer:

Photo Sheet must not appear.

This dynamic configuration is one of the core product features.

====================================================

36. DELIVERY SETTINGS

====================================================

Create a Delivery Settings section.

Enable Delivery:

ON/OFF

If Delivery is ON:

Configure:

Delivery Areas

Delivery Charge

Free Delivery Threshold optional

Estimated Delivery Time

Example:

Delivery Fee:

₹30

Free Delivery Above:

₹500

Estimated Time:

30–45 Minutes

Customers should only see delivery when available.

====================================================

37. PAYMENT SETTINGS

====================================================

Shopkeeper controls payment methods.

Create:

Payment Settings

PAY FULL AMOUNT:

Enable / Disable

PAY ADVANCE:

Enable / Disable

CASH AT PICKUP:

Enable / Disable

CASH ON DELIVERY:

Enable / Disable

====================================================

38. PAY ADVANCE SETTINGS

====================================================

When Pay Advance is enabled:

Advance Type:

Fixed Amount

or

Percentage

Fixed example:

₹50

Percentage example:

30%

The system automatically calculates:

Order Total

Advance

Remaining Balance

The customer sees:

Pay Advance

Pay a portion now and pay the remaining balance at pickup or delivery.

====================================================

39. SHOP PROFILE

====================================================

Create:

Shop Name

Shop Logo

Owner Name

Phone

Email

Shop Address

Opening Hours

Pickup Availability

Delivery Availability

Delivery Areas

Save Changes

====================================================

40. SHOPKEEPER SETTINGS

====================================================

Sections:

Shop Account

Profile

Notifications

Business Preferences

Payment Settings

Security

====================================================

41. DATABASE / DATA MODEL

====================================================

Design the application architecture around these major entities:

USER

CUSTOMER PROFILE

SHOP

SHOP SETTINGS

PRINT SERVICE

PAPER TYPE

PRINT OPTION

ADDITIONAL SERVICE

DELIVERY SETTINGS

PAYMENT SETTINGS

ADDRESS

DOCUMENT

ORDER

ORDER ITEM

ORDER STATUS

PAYMENT

PAYMENT STATUS

SUPPORT TICKET

Important relationship:

SHOP

↓

CONFIGURES SERVICES

↓

CUSTOMER SELECTS SHOP

↓

SYSTEM LOADS SHOP SETTINGS

↓

CUSTOMER CUSTOMIZES ORDER

↓

ORDER CREATED

====================================================

42. ORDER DATA CONCEPT

====================================================

An order should contain:

Order ID

Customer ID

Shop ID

Documents

Page Count

Paper Type

Print Type

Print Side

Copies

Page Range

Orientation

Binding

Additional Services

Fulfillment Type:

Pickup

or

Delivery

Delivery Address

Pricing Breakdown

Order Total

Payment Method

Advance Amount

Balance Amount

Payment Status

Order Status

Created At

Updated At

====================================================

43. PAYMENT LOGIC

====================================================

PAY FULL AMOUNT:

Amount Paid:

Order Total

Balance:

0

Status:

Fully Paid

PAY ADVANCE:

Amount Paid:

Advance

Balance:

Order Total - Advance

Status:

Partially Paid

CASH AT PICKUP:

Amount Paid:

0

Balance:

Order Total

Status:

Unpaid

CASH ON DELIVERY:

Amount Paid:

0

Balance:

Order Total

Status:

Unpaid

After balance collection:

Status:

Fully Paid

====================================================

44. UX PRINCIPLES

====================================================

The UX must be extremely easy.

Follow these principles:

ONE PRIMARY ACTION PER SCREEN.

Do not overload users.

Use clear labels.

Do not use technical language for customers.

Always explain pricing.

Always show progress.

Always provide Back and Continue.

Prevent accidental actions.

Confirm destructive actions.

Use meaningful empty states.

Use loading states.

Use success states.

Use error states.

Mobile interactions must be thumb-friendly.

Buttons should have clear labels.

Do not use ambiguous icons without labels for critical actions.

====================================================

45. MOTION AND MICRO-INTERACTIONS

====================================================

Create subtle and premium motion.

Use motion sparingly.

Include:

Smooth page transitions

Card hover elevation

Button press feedback

Upload progress animation

Upload success feedback

Step transition animation

Status update animation

Sidebar animation

Modal transitions

Skeleton loading

Price update animation

Order confirmation animation

Avoid excessive animation.

Motion should improve clarity, not distract users.

====================================================

46. RESPONSIVE DESIGN

====================================================

Create:

Desktop:

1440px

Tablet:

768px

Mobile:

390px

CUSTOMER:

Mobile-first.

SHOPKEEPER:

Desktop-first but responsive.

Mobile bottom navigation:

Home

Order

My Orders

Profile

Ensure all forms and order flows work perfectly on mobile.

====================================================

47. ACCESSIBILITY

====================================================

Ensure:

Good color contrast.

Keyboard accessibility.

Visible focus states.

Clear error messages.

Large touch targets.

Proper labels.

Accessible forms.

Do not rely only on color for status.

====================================================

48. REUSABLE COMPONENTS

====================================================

Create reusable components for:

Button

Input

Textarea

Select

Checkbox

Radio Card

Toggle

Modal

Dialog

Toast

Card

Badge

Status Badge

Shop Card

Order Card

Payment Card

Price Summary

File Upload

File Card

Progress Stepper

Order Timeline

Address Card

Service Configuration Card

Sidebar

Navbar

Bottom Navigation

Empty State

Loading State

Skeleton

Error State

====================================================

49. REQUIRED UI STATES

====================================================

Create proper variants:

Default

Hover

Active

Selected

Disabled

Loading

Success

Error

Empty

====================================================

50. FINAL USER FLOW

====================================================

SHOPKEEPER:

Configure Shop

↓

Enable Print Services

↓

Set Prices

↓

Configure Delivery

↓

Configure Payment

↓

Configure Pay Advance

↓

Services Become Available

CUSTOMER:

Open Home

↓

Order My Xerox

↓

Upload Document

↓

Select Shop

↓

Load Shop Services

↓

Customize Print

↓

Select Pickup or Delivery

↓

Select Payment Method

↓

Pay Full Amount / Pay Advance / Cash

↓

Place Order

SHOPKEEPER:

Receives Order

↓

Accepts or Rejects

↓

Printing

↓

Finishing

IF PICKUP:

Ready for Pickup

↓

Customer Collects

↓

Collect Balance if Required

↓

Completed

IF DELIVERY:

Ready for Delivery

↓

Out for Delivery

↓

Collect Balance if Required

↓

Delivered

CUSTOMER:

My Orders

↓

View Live Status

↓

View Payment Status

↓

View Pickup / Delivery Information

====================================================

51. FINAL QUALITY REQUIREMENTS

====================================================

The final application must feel:

Production-ready.

Premium.

Modern.

Easy to understand.

Visually clean.

Consistent.

Professional.

The customer side must be heavily UX-driven and inspired by the simplicity and familiarity of the provided reference website.

The shopkeeper side must be operationally efficient and make service configuration and order management easy.

Do not generate unnecessary pages.

Do not add random features.

Do not use lorem ipsum.

Use realistic data.

Use Indian currency:

₹

Use realistic Indian names, addresses, and examples where sample data is needed.

Prioritize this complete core journey:

DOCUMENT UPLOAD

→

SHOP SELECTION

→

DYNAMIC PRINT CUSTOMIZATION

→

PICKUP OR DELIVERY

→

PAYMENT

→

PAY ADVANCE IF SELECTED

→

ORDER PLACEMENT

→

SHOPKEEPER PROCESSING

→

LIVE STATUS UPDATE

→

BALANCE COLLECTION

→

ORDER COMPLETION

Build the UI and application structure carefully.

Before generating individual pages, first establish:

1. Design system

2. Shared components

3. Customer navigation

4. Shopkeeper navigation

5. Data types

6. Core order state

7. Dynamic shop configuration model

Then build the customer experience and shopkeeper experience consistently around that architecture.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/81c65352-b4a2-4efb-af76-04ac30c4363c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
