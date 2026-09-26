import Link from "next/link";
import {
    ArrowLeft,
    FileText,
    ShieldCheck,
    Mail,
    Printer,
    Scale,
} from "lucide-react";

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-[#05070b] text-slate-200">
            {/* Header */}
            <header className="border-b border-slate-800/70 bg-[#05070b]/95">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white"
                    >
                        <Printer className="h-5 w-5 text-blue-500" />
                        XEROXMATE
                    </Link>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-700 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="border-b border-slate-800/60">
                <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
                        <FileText className="h-3.5 w-3.5" />
                        Legal
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                        Terms & Conditions
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                        These Terms & Conditions govern your access to and use of
                        XEROXMATE and its online printing services.
                    </p>

                    <p className="mt-5 text-sm text-slate-500">
                        Last Updated: September 26, 2026
                    </p>
                </div>
            </section>

            {/* Content */}
            <article className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
                <div className="space-y-12">
                    <PolicySection number="01" title="About XEROXMATE">
                        <p>
                            XEROXMATE is an online printing service that allows customers to
                            upload documents, configure printing specifications, select an
                            available print shop, choose pickup or delivery where available,
                            select a payment method, and manage their printing orders.
                        </p>
                        <p>
                            XEROXMATE may operate as a technology platform connecting
                            customers with participating printing service providers.
                        </p>
                    </PolicySection>

                    <PolicySection number="02" title="User Account">
                        <p>To use certain XEROXMATE features, you may need to create an account.</p>
                        <p>You are responsible for:</p>
                        <BulletList
                            items={[
                                "Providing accurate information.",
                                "Maintaining the confidentiality of your login credentials.",
                                "Keeping your account information updated.",
                                "All activity performed through your account.",
                            ]}
                        />
                        <p>
                            You should immediately notify XEROXMATE if you believe your
                            account has been accessed without authorization.
                        </p>
                    </PolicySection>

                    <PolicySection number="03" title="Document Uploads">
                        <p>
                            You are responsible for ensuring that all files uploaded to
                            XEROXMATE are legally owned by you or that you have permission
                            to reproduce them.
                        </p>

                        <p>Uploaded files must not:</p>

                        <BulletList
                            items={[
                                "Contain unlawful or prohibited content.",
                                "Infringe copyright, trademark, privacy, or other rights.",
                                "Be used to facilitate illegal activity.",
                                "Contain material prohibited by applicable law.",
                            ]}
                        />

                        <p>
                            XEROXMATE does not claim ownership of documents uploaded by
                            customers. You grant XEROXMATE and the selected printing service
                            provider the limited permission necessary to process and print
                            your files according to your order.
                        </p>
                    </PolicySection>

                    <PolicySection number="04" title="Prohibited Content">
                        <p>
                            XEROXMATE must not be used to reproduce content that is unlawful
                            or that violates the rights of others.
                        </p>

                        <p>Examples may include:</p>

                        <BulletList
                            items={[
                                "Fraudulent or forged documents.",
                                "Content intended to facilitate illegal activity.",
                                "Material that infringes intellectual property rights.",
                                "Documents containing unlawfully obtained personal information.",
                                "Any material prohibited by applicable law.",
                            ]}
                        />

                        <p>
                            XEROXMATE may refuse an order where there is a reasonable basis
                            to believe that the order involves prohibited or unlawful
                            content.
                        </p>
                    </PolicySection>

                    <PolicySection number="05" title="Printing Specifications">
                        <p>
                            Customers are responsible for reviewing their selected
                            specifications before placing an order.
                        </p>

                        <p>These may include:</p>

                        <BulletList
                            items={[
                                "Paper size.",
                                "Paper type.",
                                "Colour or black-and-white printing.",
                                "Single-sided or double-sided printing.",
                                "Number of copies.",
                                "Page layout.",
                                "Binding.",
                                "Lamination.",
                                "Stapling.",
                                "Special instructions.",
                                "Pickup or delivery selection.",
                            ]}
                        />

                        <p>
                            Once an order has entered the printing process, changes may not
                            be possible.
                        </p>
                    </PolicySection>

                    <PolicySection number="06" title="Prices and Charges">
                        <p>
                            The total order price may depend on the printing specifications
                            selected by the customer.
                        </p>

                        <p>Applicable charges may include:</p>

                        <BulletList
                            items={[
                                "Printing charges.",
                                "Paper charges.",
                                "Binding charges.",
                                "Additional finishing charges.",
                                "Delivery charges.",
                                "Other applicable service charges.",
                            ]}
                        />

                        <p>
                            The applicable amount displayed during checkout should be
                            reviewed before the order is confirmed.
                        </p>

                        <p>
                            Prices may change from time to time. Changes will generally
                            apply to new orders and will not alter an already confirmed
                            order unless otherwise communicated.
                        </p>
                    </PolicySection>

                    <PolicySection number="07" title="Print Shop Selection">
                        <p>
                            Customers may select a participating print shop based on
                            available information such as location, availability, services,
                            and estimated pricing.
                        </p>

                        <p>
                            The selected print shop is responsible for fulfilling the
                            printing portion of the order according to the confirmed
                            specifications.
                        </p>

                        <p>Actual completion time may vary due to:</p>

                        <BulletList
                            items={[
                                "Order volume.",
                                "Document complexity.",
                                "Shop operating hours.",
                                "Equipment availability.",
                                "Material availability.",
                                "Technical issues.",
                                "Circumstances outside the shop's reasonable control.",
                            ]}
                        />
                    </PolicySection>

                    <PolicySection number="08" title="Pickup and Delivery">
                        <p>
                            Depending on the selected print shop, customers may be offered
                            pickup from the print shop or home/specified-address delivery.
                        </p>

                        <p>
                            Delivery availability, delivery charges, and estimated delivery
                            time may vary by shop and location.
                        </p>

                        <p>
                            Customers are responsible for providing a correct and accessible
                            delivery address.
                        </p>

                        <p>
                            XEROXMATE and the print shop are not responsible for delays
                            caused by incorrect or incomplete address information provided by
                            the customer.
                        </p>
                    </PolicySection>

                    <PolicySection number="09" title="Payments">
                        <p>
                            XEROXMATE may provide multiple payment options, including
                            applicable online and offline payment methods.
                        </p>

                        <p>
                            Where an advance payment option is selected, the customer must
                            pay the remaining amount through the applicable method specified
                            for the order.
                        </p>

                        <p>
                            An order may not be considered fully paid until the required
                            payment has been successfully received.
                        </p>
                    </PolicySection>

                    <PolicySection number="10" title="Order Confirmation">
                        <p>
                            An order is considered confirmed when the required information
                            has been submitted and the applicable payment requirement has
                            been completed.
                        </p>

                        <p>
                            Customers should verify the order details before confirmation.
                        </p>
                    </PolicySection>

                    <PolicySection number="11" title="Order Status">
                        <p>XEROXMATE may display order statuses such as:</p>

                        <div className="my-5 flex flex-wrap gap-2">
                            {[
                                "Order Placed",
                                "Accepted",
                                "Printing",
                                "Ready",
                                "Out for Delivery",
                                "Delivered / Picked Up",
                            ].map((status) => (
                                <span
                                    key={status}
                                    className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300"
                                >
                                    {status}
                                </span>
                            ))}
                        </div>

                        <p>
                            Available statuses may vary depending on the selected service
                            and print shop.
                        </p>
                    </PolicySection>

                    <PolicySection number="12" title="Customer Responsibilities">
                        <p>Customers agree to:</p>

                        <BulletList
                            items={[
                                "Provide accurate account and contact information.",
                                "Upload valid and printable files.",
                                "Select the correct printing specifications.",
                                "Review order details before confirmation.",
                                "Provide accurate pickup or delivery information.",
                                "Make required payments.",
                                "Collect orders within the applicable pickup period.",
                            ]}
                        />
                    </PolicySection>

                    <PolicySection number="13" title="Service Availability">
                        <p>
                            XEROXMATE aims to provide reliable service but does not guarantee
                            that the platform will always be available without interruption.
                        </p>

                        <p>Service may temporarily become unavailable due to:</p>

                        <BulletList
                            items={[
                                "Maintenance.",
                                "Technical problems.",
                                "Network failures.",
                                "Third-party service interruptions.",
                                "Security incidents.",
                                "Events beyond reasonable control.",
                            ]}
                        />
                    </PolicySection>

                    <PolicySection number="14" title="Intellectual Property">
                        <p>
                            The XEROXMATE name, branding, website design, software, interface,
                            graphics, logos, and related materials are protected by
                            applicable intellectual-property laws.
                        </p>

                        <p>
                            You may not reproduce, modify, distribute, or commercially
                            exploit XEROXMATE materials without appropriate authorization.
                        </p>
                    </PolicySection>

                    <PolicySection number="15" title="Limitation of Responsibility">
                        <p>
                            XEROXMATE is not responsible for losses resulting from
                            information that a customer entered incorrectly, files uploaded
                            incorrectly, or specifications selected incorrectly by the
                            customer.
                        </p>

                        <p>
                            Where XEROXMATE acts as a platform connecting customers with
                            independent printing providers, responsibility for the physical
                            printing service may rest with the relevant print shop.
                        </p>

                        <p>
                            Nothing in these Terms limits rights or remedies that cannot
                            legally be excluded under applicable law.
                        </p>
                    </PolicySection>

                    <PolicySection number="16" title="Changes to These Terms">
                        <p>
                            XEROXMATE may update these Terms & Conditions from time to time.
                            Updated terms will be published on this page with a revised
                            "Last Updated" date.
                        </p>
                    </PolicySection>

                    <ContactCard />
                </div>
            </article>
        </main>
    );
}

function PolicySection({
    number,
    title,
    children,
}: {
    number: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <div className="mb-4 flex items-center gap-3">
                <span className="text-xs font-semibold tracking-widest text-blue-500">
                    {number}
                </span>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">
                    {title}
                </h2>
            </div>

            <div className="space-y-4 text-sm leading-7 text-slate-400 sm:text-base">
                {children}
            </div>
        </section>
    );
}

function BulletList({ items }: { items: string[] }) {
    return (
        <ul className="space-y-2 pl-5 text-slate-400">
            {items.map((item) => (
                <li key={item} className="list-disc pl-1">
                    {item}
                </li>
            ))}
        </ul>
    );
}

function ContactCard() {
    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
            <div className="flex items-start gap-4">
                <div className="rounded-xl bg-blue-500/10 p-3">
                    <Mail className="h-5 w-5 text-blue-400" />
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-white">
                        Contact XEROXMATE
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                        For questions regarding these Terms & Conditions, contact us at:
                    </p>

                    <a
                        href="mailto:desflyer.tech@gmail.com"
                        className="mt-3 inline-block font-medium text-blue-400 hover:text-blue-300"
                    >
                        desflyer.tech@gmail.com
                    </a>

                    <p className="mt-2 text-sm text-slate-500">
                        Tamil Nadu, India
                    </p>
                </div>
            </div>
        </section>
    );
}