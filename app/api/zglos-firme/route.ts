import { NextResponse } from "next/server"

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1448458696844775596/7ZQ69lp5clGYH0TNUEFcGUC6S8Fx9JHJEln-Fo6k7EONfO_UJl_7SGWp3MJSbnLGK6zu"

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const requestType = formData.get("requestType") as string
        const brandName = formData.get("brandName") as string
        const sourceLink = formData.get("sourceLink") as string
        const comment = formData.get("comment") as string
        const email = formData.get("email") as string
        const attachment = formData.get("attachment") as File | null

        // Determine embed color and title based on request type
        let color = 3447003 // Blue
        let title = "Nowe Zgłoszenie"

        if (requestType === "add-brand") {
            color = 5763719 // Green
            title = "🆕 Nowa Firma"
        } else if (requestType === "correction") {
            color = 16776960 // Yellow
            title = "✏️ Zgłoszenie Poprawki"
        } else if (requestType === "remove-logo") {
            color = 15548997 // Red
            title = "🗑️ Żądanie Usunięcia Logo"
        }

        const fields = [
            { name: "Nazwa Firmy", value: brandName || "Brak", inline: true },
            { name: "Typ Zgłoszenia", value: requestType || "Brak", inline: true },
            { name: "Email", value: email || "Brak", inline: true },
            { name: "Link do źródła", value: sourceLink || "Brak", inline: false },
            { name: "Komentarz", value: comment || "Brak", inline: false },
        ]

        let fileToUpload: File | null = null
        let attachmentNote = ""

        // Handle attachment
        if (attachment && attachment.size > 0) {
            if (attachment.size > 8 * 1024 * 1024) {
                attachmentNote = `⚠️ Użytkownik próbował załączyć plik: ${attachment.name}, ale był za duży (>8MB).`
            } else {
                fileToUpload = attachment
                attachmentNote = `📎 Załączono plik: ${attachment.name} (${(attachment.size / 1024).toFixed(1)} KB)`
            }

            fields.push({
                name: "Załącznik",
                value: attachmentNote,
                inline: false
            })
        }

        const embed = {
            title: title,
            color: color,
            fields: fields,
            timestamp: new Date().toISOString(),
            footer: {
                text: "CzyPolskaFirma.pl Report System",
            },
        }

        // Construct FormData for Discord
        const discordFormData = new FormData()
        discordFormData.append("payload_json", JSON.stringify({ embeds: [embed] }))

        // Handle multiple attachments from request
        // According to Next.js/Web standards, getAll returns an array of FormDataEntryValue (string | File)
        const attachments = formData.getAll("attachment") as File[] // Cast assuming frontend sends Files

        // Limits
        const MAX_FILES = 10
        const MAX_SIZE_MB = 8

        let fileIndex = 0
        let filesTooLargeCount = 0

        // Iterate through all attachments
        for (const file of attachments) {
            if (fileIndex >= MAX_FILES) break

            if (file.size > 0 && file.size <= MAX_SIZE_MB * 1024 * 1024) {
                // Discord convention for multiple files is often 'file0', 'file1' or 'files[0]'
                // Most libraries / Discord API docs suggest 'files[n]'
                discordFormData.append(`files[${fileIndex}]`, file)
                fileIndex++
            } else if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                filesTooLargeCount++
            }
        }

        if (filesTooLargeCount > 0) {
            // Just append a note if we haven't already
            fields.push({
                name: "⚠️ Ostrzeżenie",
                value: `Pominięto ${filesTooLargeCount} plik(ów) przekraczających limit 8MB.`,
                inline: false
            })
            // Update payload_json with new field
            discordFormData.set("payload_json", JSON.stringify({ embeds: [embed] }))
        }

        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            body: discordFormData,
        })

        if (!response.ok) {
            const respText = await response.text()
            throw new Error(`Discord API error: ${response.status} ${respText}`)
        }

        return NextResponse.json({ success: true, message: "Zgłoszenie wysłane" })

    } catch (error) {
        console.error("Błąd podczas wysyłania zgłoszenia:", error)
        return NextResponse.json(
            { success: false, message: "Wystąpił błąd podczas przetwarzania zgłoszenia." },
            { status: 500 }
        )
    }
}
