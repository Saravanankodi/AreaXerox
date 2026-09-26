import Link from "next/link";
import {
    ArrowLeft,
    ShieldCheck,
    Mail,
    Lock,
    Printer,
} from "lucide-react";

export default function PrivacyPage() {
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
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Privacy & Security
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                        Privacy Policy
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                        This Privacy Policy explains how XEROXMATE collects, uses,
                        protects, and handles information when you use our services.
                    </p>

                    <p className="mt-5 text-sm text-slate-500">
                        Last Updated: September 26, 2026
                    </p>
                </div>
            </section>

            {/* Content */}
            <article className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
                <div className="space-y-12">
                    <PolicySection number="01" title="Information We Collect">
                        <p>
                            Depending on how you use XEROXMATE, we may collect information
                            necessary to provide our services.
                        </p>

                        <Subheading>Account Information</Subheading>

                        <BulletList
                            items={[
                                "Name.",
                                "Email address.",
                                "Phone number.",
                                "Login credentials or authentication information.",
                            ]}
                        />

                        <Subheading>Order Information</Subheading>

                        <BulletList
                            items={[
                                "Uploaded documents.",
                                "Printing specifications.",
                                "Number of pages and copies.",
                                "Selected print shop.",
                                "Pickup or delivery preference.",
                                "Delivery address where applicable.",
                                "Payment-related order information.",
                                "Order status and history.",
                            ]}
                        />

                        <Subheading>Communication Information</Subheading>

                        <BulletList
                            items={[
                                "Your name.",
                                "Contact details.",
                                "Messages.",
                                "Support requests.",
                                "Information you voluntarily provide.",
                            ]}
                        />
                    </PolicySection>

                    <PolicySection number="02" title="Uploaded Documents">
                        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                            <div className="flex gap-4">
                                <Lock className="mt-1 h-5 w-5 shrink-0 text-blue-400" />
                                <p className="text-sm leading-7 text-slate-300">
                                    Documents uploaded for printing are processed so that the
                                    requested printing service can be completed. Access to
                                    uploaded files should be limited to the systems and service
                                    providers necessary to process your order.
                                </p>
                            </div>
                        </div>

                        <p>
                            Customers should avoid uploading documents containing highly
                            sensitive information unless it is necessary for the requested
                            printing service.
                        </p>
                    </PolicySection>

                    <PolicySection number="03" title="How We Use Your Information">
                        <p>We may use collected information to:</p>

                        <BulletList
                            items={[
                                "Create and manage your account.",
                                "Process printing orders.",
                                "Send order confirmations and status updates.",
                                "Communicate with selected print shops.",
                                "Arrange pickup or delivery.",
                                "Process applicable payments.",
                                "Provide customer support.",
                                "Improve XEROXMATE services.",
                                "Detect and prevent fraud, abuse, and unauthorized activity.",
                                "Maintain platform security.",
                                "Comply with legal obligations.",
                            ]}
                        />
                    </PolicySection>

                    <PolicySection number="04" title="Sharing Information">
                        <p>
                            We do not treat your personal information as something that
                            should be publicly available.
                        </p>

                        <p>
                            Information may be shared with parties that are necessary to
                            provide the requested service, including:
                        </p>

                        <BulletList
                            items={[
                                "The print shop selected for your order.",
                                "Delivery providers where applicable.",
                                "Payment service providers.",
                                "Hosting and infrastructure providers.",
                                "Customer-support or technology providers.",
                                "Government authorities where disclosure is legally required.",
                            ]}
                        />

                        <p>
                            Information shared with a print shop should be limited to what
                            is reasonably necessary to fulfil the customer's order.
                        </p>
                    </PolicySection>

                    <PolicySection number="05" title="Payment Information">
                        <p>
                            Where third-party payment services are used, payment processing
                            may be performed by the applicable payment provider.
                        </p>

                        <p>
                            XEROXMATE may receive transaction-related information such as
                            payment status, transaction reference, or payment method.
                        </p>

                        <p>
                            Payment card or banking credentials should be handled by the
                            applicable payment provider rather than stored directly by
                            XEROXMATE unless explicitly stated otherwise.
                        </p>
                    </PolicySection>

                    <PolicySection number="06" title="Cookies and Similar Technologies">
                        <p>XEROXMATE may use cookies or similar technologies to:</p>

                        <BulletList
                            items={[
                                "Keep users signed in.",
                                "Maintain session information.",
                                "Remember preferences.",
                                "Understand website usage.",
                                "Improve performance and security.",
                            ]}
                        />

                        <p>
                            You may be able to control cookies through your browser settings.
                        </p>
                    </PolicySection>

                    <PolicySection number="07" title="Data Security">
                        <p>
                            We use reasonable technical and organizational measures designed
                            to protect information against unauthorized access, loss, misuse,
                            alteration, or disclosure.
                        </p>

                        <p>
                            However, no internet-based service can guarantee absolute
                            security.
                        </p>

                        <p>
                            You should use strong passwords and avoid sharing your account
                            credentials with others.
                        </p>
                    </PolicySection>

                    <PolicySection number="08" title="Data Retention">
                        <p>
                            We retain information for as long as reasonably necessary to:
                        </p>

                        <BulletList
                            items={[
                                "Provide requested services.",
                                "Maintain order records.",
                                "Resolve disputes.",
                                "Meet legal or accounting requirements.",
                                "Maintain security and prevent abuse.",
                            ]}
                        />

                        <p>
                            Retention periods may vary depending on the type of information
                            and applicable legal requirements.
                        </p>
                    </PolicySection>

                    <PolicySection number="09" title="Your Privacy Choices">
                        <p>
                            Depending on applicable law, you may have rights concerning your
                            personal information, including the ability to:
                        </p>

                        <BulletList
                            items={[
                                "Request access to certain personal information.",
                                "Request correction of inaccurate information.",
                                "Request deletion where legally applicable.",
                                "Withdraw certain permissions or consent.",
                                "Ask questions about how your information is handled.",
                            ]}
                        />

                        <p>
                            Some information may need to be retained where required by law
                            or for legitimate operational purposes.
                        </p>
                    </PolicySection>

                    <PolicySection number="10" title="Children's Privacy">
                        <p>
                            XEROXMATE is not intentionally designed to collect personal
                            information from children without appropriate authorization.
                        </p>

                        <p>
                            If you believe that a child has provided personal information
                            improperly, please contact us so that the matter can be reviewed.
                        </p>
                    </PolicySection>

                    <PolicySection number="11" title="Third-Party Services">
                        <p>
                            XEROXMATE may integrate with third-party services for functions
                            such as:
                        </p>

                        <BulletList
                            items={[
                                "Authentication.",
                                "Payments.",
                                "Hosting.",
                                "Analytics.",
                                "Communication.",
                                "Delivery.",
                                "Storage.",
                            ]}
                        />

                        <p>
                            These services may process information according to their own
                            privacy policies and applicable terms.
                        </p>
                    </PolicySection>

                    <PolicySection number="12" title="Changes to This Privacy Policy">
                        <p>
                            We may update this Privacy Policy when our services, technology,
                            or legal requirements change.
                        </p>

                        <p>
                            The updated policy will be published on this page with a revised
                            "Last Updated" date.
                        </p>
                    </PolicySection>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl bg-blue-500/10 p-3">
                                <Mail className="h-5 w-5 text-blue-400" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    Privacy Questions?
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    For privacy-related questions or requests, contact:
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

function Subheading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="pt-2 text-sm font-semibold text-slate-200">
            {children}
        </h3>
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