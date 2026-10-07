import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { createDispute } from "../api/API.js";

function ReportDeliveryButton({
  delivery,
  currentUserId,
  hasReported = false,
  reportDataLoaded = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const requesterId = delivery.requesterId == null ? null : String(delivery.requesterId);
  const courierId = delivery.courierId == null ? null : String(delivery.courierId);
  const reporterId = currentUserId == null ? null : String(currentUserId);
  const disputedUserId = reporterId === requesterId ? courierId
    : reporterId === courierId ? requesterId
      : null;

  async function submitReport() {
    setError("");
    setSubmitting(true);
    try {
      await createDispute({ postId: String(delivery._id), message });
      setSubmitted(true);
      setMessage("");
      setIsOpen(false);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!reportDataLoaded || hasReported || submitted) return null;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        aria-label="Report this delivery"
        title={disputedUserId ? "Report this delivery" : "A courier must be assigned before this delivery can be reported"}
        disabled={!disputedUserId}
        onClick={() => {
          setError("");
          setIsOpen(true);
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted transition hover:bg-background hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path d="M5 21V4m0 1h12l-2 4 2 4H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 7.5v3m0 2h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <Modal>
        <Modal.Backdrop
          isOpen={isOpen}
          onOpenChange={(open) => {
            if (!open && !submitting) setIsOpen(false);
          }}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Report delivery</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="mb-3 text-sm text-muted">
                  Describe the issue with “{delivery.item}”. The report will be linked to this delivery.
                </p>
                <label htmlFor={`report-message-${delivery._id}`} className="mb-1 block text-sm font-semibold text-ink">
                  Message
                </label>
                <textarea
                  id={`report-message-${delivery._id}`}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={2000}
                  rows={5}
                  required
                  className="w-full rounded-lg border border-border bg-surface p-3 text-sm text-ink"
                  placeholder="Explain what happened..."
                />
                {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="primary"
                  isDisabled={submitting || !message.trim()}
                  onPress={submitReport}
                  className="bg-primary text-white"
                >
                  {submitting ? "Submitting..." : "Submit report"}
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={submitting}
                  onPress={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

export default ReportDeliveryButton;
