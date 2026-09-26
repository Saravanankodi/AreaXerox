import Link from "next/link";
import {
    ArrowLeft,
    RefreshCcw,
    Mail,
    Printer,
    CheckCircle2,
} from "lucide-react";

export default function RefundPolicyPage() {
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
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Orders & Refunds
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                        Refund & Cancellation Policy
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                        This policy explains how order cancellations, refunds, reprints,
                        and printing-related issues are handled by XEROXMATE.
                    </p>

                    <p className="mt-5 text-sm text-slate-500">
                        Last Updated: September 26, 2026
                    </p>
                </div>
            </section>

            {/* Content */}
            <article className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
                <div className="space-y-12">
                    <PolicySection number="01" title="Order Cancellation">
                        <p>
                            Customers may request cancellation before the order has entered
                            the printing process.
                        </p>

                        <p>Cancellation availability may depend on the current order status.</p>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <InfoBox title="Cancellation may generally be possible">
                                <BulletList
                                    items={[
                                        "The order has been placed but printing has not started.",
                                        "The selected print shop has not yet begun processing the order.",
                                    ]}
                                />
                            </InfoBox>

                            <InfoBox title="Cancellation may not be possible">
                                <BulletList
                                    items={[
                                        "Printing has already started.",
                                        "Binding or finishing work has started.",
                                        "The order has been completed.",
                                        "The order has been dispatched for delivery.",
                                        "The order has already been collected.",
                                    ]}
                                />
                            </InfoBox>
                        </div>
                    </PolicySection>

                    <PolicySection number="02" title="Refund Eligibility">
                        <p>A refund may be considered when:</p>

                        <BulletList
                            items={[
                                "An eligible order is successfully cancelled before processing begins.",
                                "XEROXMATE or the selected print shop is unable to fulfil a confirmed order.",
                                "The order has a significant service-related issue attributable to the service provider.",
                                "A duplicate payment has been made for the same order.",
                                "An incorrect amount was charged due to a verified payment or system error.",
                            ]}
                        />

                        <p>
                            Refund eligibility is determined based on the circumstances of
                            the individual order.
                        </p>
                    </PolicySection>

                    <PolicySection number="03" title="Incorrect Customer Specifications">
                        <p>
                            Customers are responsible for reviewing their order before
                            confirmation.
                        </p>

                        <p>Refunds may generally not be provided where the issue resulted from:</p>

                        <BulletList
                            items={[
                                "Incorrect file.",
                                "Incorrect number of copies.",
                                "Incorrect paper size.",
                                "Incorrect colour selection.",
                                "Incorrect page range.",
                                "Incorrect binding.",
                                "Incorrect page layout.",
                                "Incorrect delivery or pickup selection.",
                            ]}
                        />

                        <p>
                            Where technically possible, customers should contact support
                            immediately after identifying an error.
                        </p>
                    </PolicySection>

                    <PolicySection number="04" title="Printing Quality Issues">
                        <p>
                            If the delivered or collected printed material contains a
                            significant production issue, customers should contact XEROXMATE
                            support as soon as possible.
                        </p>

                        <p>Examples may include:</p>

                        <BulletList
                            items={[
                                "Missing pages.",
                                "Incorrect page order caused during production.",
                                "Significant printing defects.",
                                "Incorrect printing specifications compared with the confirmed order.",
                                "Incorrect binding or finishing.",
                            ]}
                        />

                        <p>
                            Customers may be asked to provide photographs or other
                            information to help verify the issue.
                        </p>
                    </PolicySection>

                    <PolicySection number="05" title="Reprint">
                        <p>
                            Depending on the circumstances, XEROXMATE or the selected print
                            shop may offer:
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                "A reprint of the affected pages.",
                                "A replacement order.",
                                "A partial refund.",
                                "A full refund.",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                                >
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-400" />
                                    <span className="text-sm text-slate-300">{item}</span>
                                </div>
                            ))}
                        </div>

                        <p>
                            The resolution will depend on the nature and extent of the
                            verified issue.
                        </p>
                    </PolicySection>

                    <PolicySection number="06" title="Delivery Problems">
                        <p>
                            For delivery orders, customers should provide an accurate
                            delivery address and remain available to receive the order where
                            required.
                        </p>

                        <p>
                            Additional delivery attempts or charges may apply where a
                            delivery fails because of:
                        </p>

                        <BulletList
                            items={[
                                "Incorrect address.",
                                "Incomplete address.",
                                "Customer unavailable.",
                                "Customer refusal to receive the order.",
                                "Other circumstances attributable to the customer.",
                            ]}
                        />
                    </PolicySection>

                    <PolicySection number="07" title="Advance Payments">
                        <p>
                            If an order is cancelled and the customer has already paid an
                            advance, the refundable amount will depend on the order's
                            processing status and any non-recoverable charges that have
                            already been incurred.
                        </p>

                        <p>
                            Once printing or finishing has started, the advance may not be
                            fully refundable.
                        </p>
                    </PolicySection>

                    <PolicySection number="08" title="Full Payments">
                        <p>
                            For fully prepaid orders, eligible refunds will generally be
                            processed after the cancellation or refund request has been
                            reviewed and approved.
                        </p>

                        <p>
                            The amount refunded will depend on the applicable refund
                            decision.
                        </p>
                    </PolicySection>

                    <PolicySection number="09" title="Refund Processing">
                        <p>
                            Approved refunds will be initiated through the applicable payment
                            method or payment provider.
                        </p>

                        <p>
                            The time required for the refunded amount to appear in the
                            customer's account may depend on the payment provider or banking
                            institution.
                        </p>
                    </PolicySection>

                    <PolicySection number="10" title="Cash Payments">
                        <p>
                            For orders paid through cash at pickup or delivery, refunds will
                            be handled according to the circumstances of the order and the
                            applicable arrangement with the selected print shop.
                        </p>

                        <p>
                            Customers should contact XEROXMATE support or the relevant print
                            shop for assistance.
                        </p>
                    </PolicySection>

                    <PolicySection number="11" title="Non-Refundable Circumstances">
                        <p>
                            A refund may generally not be available where:
                        </p>

                        <BulletList
                            items={[
                                "The customer changes their mind after printing has started.",
                                "The wrong file was uploaded by the customer.",
                                "Incorrect printing specifications were selected by the customer.",
                                "The customer provided an incorrect delivery address.",
                                "The customer fails to collect a completed order within the applicable collection period.",
                                "The order was correctly produced according to the confirmed specifications.",
                            ]}
                        />
                    </PolicySection>

                    <PolicySection number="12" title="How to Request a Refund or Cancellation">
                        <p>
                            To request a cancellation, refund, or report a printing issue,
                            contact XEROXMATE support with:
                        </p>

                        <BulletList
                            items={[
                                "Order ID.",
                                "Registered name.",
                                "Registered phone number or email.",
                                "Reason for the request.",
                                "Relevant photographs or supporting information, if applicable.",
                            ]}
                        />

                        <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                            <p className="text-sm text-slate-300">
                                Providing the Order ID will help us process the request more
                                efficiently.
                            </p>
                        </div>
                    </PolicySection>

                    <PolicySection number="13" title="Review of Refund Requests">
                        <p>Refund requests may be reviewed based on:</p>

                        <BulletList
                            items={[
                                "Order status.",
                                "Time of cancellation request.",
                                "Printing status.",
                                "Payment status.",
                                "Selected specifications.",
                                "Evidence of the reported issue.",
                                "Information provided by the relevant print shop.",
                            ]}
                        />

                        <p>
                            XEROXMATE may contact the customer or print shop when additional
                            information is required.
                        </p>
                    </PolicySection>

                    <PolicySection number="14" title="Policy Updates">
                        <p>
                            XEROXMATE may update this Refund & Cancellation Policy from time
                            to time.
                        </p>

                        <p>
                            Changes will be published on this page with an updated
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
                                    Need Help With an Order?
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    Contact XEROXMATE customer support for cancellation, refund,
                                    or printing-related assistance.
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

function InfoBox({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
            <div className="text-sm leading-6">{children}</div>
        </div>
    );
}