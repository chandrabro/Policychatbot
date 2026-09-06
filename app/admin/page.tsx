        updateRow(index, { status: "uploading", detail: "Uploading PDF… 0%" });
        const blob = await withRetry(
          () =>
            withTimeout(
              upload(`policies/${file.name}`, file, {
                access: "public",
                handleUploadUrl: "/api/admin/blob-upload",
                clientPayload: password,
                multipart: true,
                onUploadProgress: ({ percentage }) => {
                  updateRow(index, { detail: `Uploading PDF… ${Math.round(percentage)}%` });
                },
              }),
              180_000,
              "Upload attempt timed out after 3 minutes."
            ),
          3,
          (attempt) => updateRow(index, { detail: `Upload stalled — retrying (${attempt}/3)…` })
        );
