import PDFDocument from 'pdfkit';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary directly in this file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Generate PDF buffer ──────────────────────────────────────────────
export const generatePrescriptionPDF = (prescription) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on('data',  (chunk) => buffers.push(chunk));
    doc.on('end',   ()      => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const {
      patient,
      doctor,
      clinic,
      medicines,
      diagnosis,
      instructions,
      followUpDate,
      createdAt,
    } = prescription;

    // ── Header ───────────────────────────────────────────────────────
    doc
      .fillColor('#0A1628')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(clinic?.name || 'MedFlow Clinic', { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(clinic?.address || '', { align: 'center' })
      .text(clinic?.phone   || '', { align: 'center' })
      .moveDown(0.5);

    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#00C896')
      .lineWidth(2)
      .stroke()
      .moveDown(0.5);

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#0A1628')
      .text('PRESCRIPTION', { align: 'center' })
      .moveDown(0.5);

    // ── Patient + Doctor Info ────────────────────────────────────────
    const infoTop = doc.y;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('PATIENT INFORMATION', 50, infoTop);

    doc
      .font('Helvetica')
      .fillColor('#555555')
      .text(`Name:        ${patient?.name        || 'N/A'}`, 50, doc.y + 5)
      .text(`Age:         ${patient?.age         || 'N/A'} years`, 50, doc.y + 3)
      .text(`Gender:      ${patient?.gender      || 'N/A'}`, 50, doc.y + 3)
      .text(`Phone:       ${patient?.phone       || 'N/A'}`, 50, doc.y + 3)
      .text(`Blood Group: ${patient?.bloodGroup  || 'N/A'}`, 50, doc.y + 3);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('DOCTOR INFORMATION', 320, infoTop);

    doc
      .font('Helvetica')
      .fillColor('#555555')
      .text(`Dr. ${doctor?.name || 'N/A'}`, 320, infoTop + 15)
      .text(doctor?.specialization || 'General Physician', 320, doc.y + 3)
      .text(doctor?.qualification  || '', 320, doc.y + 3)
      .text(
        `Date: ${new Date(createdAt).toLocaleDateString('en-PK', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}`,
        320, doc.y + 3
      );

    doc.moveDown(1.5);

    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#DDDDDD')
      .lineWidth(1)
      .stroke()
      .moveDown(0.5);

    // ── Diagnosis ────────────────────────────────────────────────────
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#0A1628')
      .text('DIAGNOSIS', 50, doc.y);

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#333333')
      .text(diagnosis, 50, doc.y + 5)
      .moveDown(1);

    // ── Medicines Table ──────────────────────────────────────────────
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#0A1628')
      .text('PRESCRIBED MEDICINES', 50, doc.y)
      .moveDown(0.3);

    const tableTop = doc.y;
    const col = { name: 50, dosage: 200, frequency: 310, duration: 410 };

    doc.rect(50, tableTop, 495, 22).fillColor('#0A1628').fill();

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF')
      .text('MEDICINE NAME', col.name      + 5, tableTop + 7)
      .text('DOSAGE',        col.dosage    + 5, tableTop + 7)
      .text('FREQUENCY',     col.frequency + 5, tableTop + 7)
      .text('DURATION',      col.duration  + 5, tableTop + 7);

    let rowTop = tableTop + 22;
    (medicines || []).forEach((med, index) => {
      const rowColor = index % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
      doc.rect(50, rowTop, 495, 28).fillColor(rowColor).fill();

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .text(med.name || '', col.name + 5, rowTop + 5, { width: 140 });

      doc
        .font('Helvetica')
        .text(med.dosage    || '', col.dosage    + 5, rowTop + 5, { width: 100 })
        .text(med.frequency || '', col.frequency + 5, rowTop + 5, { width: 95  })
        .text(med.duration  || '', col.duration  + 5, rowTop + 5, { width: 80  });

      if (med.instructions) {
        doc
          .fontSize(8)
          .fillColor('#888888')
          .text(`Note: ${med.instructions}`, col.name + 5, rowTop + 16, { width: 480 });
      }

      rowTop += 28;
    });

    doc
      .rect(50, tableTop, 495, rowTop - tableTop)
      .strokeColor('#DDDDDD')
      .lineWidth(0.5)
      .stroke();

    doc.y = rowTop + 10;

    // ── General Instructions ─────────────────────────────────────────
    if (instructions) {
      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#0A1628')
        .text('GENERAL INSTRUCTIONS', 50, doc.y);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#555555')
        .text(instructions, 50, doc.y + 5)
        .moveDown(1);
    }

    // ── Follow Up ────────────────────────────────────────────────────
    if (followUpDate) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#00C896')
        .text(
          `Follow-up Date: ${new Date(followUpDate).toLocaleDateString('en-PK', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}`,
          50, doc.y
        )
        .moveDown(1);
    }

    // ── Footer ───────────────────────────────────────────────────────
    doc
      .moveTo(50, doc.y + 10)
      .lineTo(545, doc.y + 10)
      .strokeColor('#DDDDDD')
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#999999')
      .text(
        'This prescription was generated digitally by MedFlow. Valid only with doctor signature.',
        50, doc.y + 20,
        { align: 'center' }
      );

    doc
      .moveTo(350, doc.y + 40)
      .lineTo(545, doc.y + 40)
      .strokeColor('#333333')
      .lineWidth(0.5)
      .stroke();

    doc
      .fontSize(9)
      .fillColor('#555555')
      .text(`Dr. ${doctor?.name || ''}`, 350, doc.y + 45, { align: 'center', width: 195 })
      .text(doctor?.specialization || '', 350, doc.y + 3, { align: 'center', width: 195 });

    doc.end();
  });
};

// ── Upload PDF to Cloudinary as PUBLIC ───────────────────────────────
export const uploadPDFToCloudinary = (pdfBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',       // required for PDF files
        folder:        'medflow/prescriptions',
        public_id:     filename,
        format:        'pdf',
        type:          'upload',    // makes it publicly accessible
        access_mode:   'public',    // explicitly public
        overwrite:     true,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          // Force the URL to use the correct public format
          // Cloudinary raw files need /raw/upload/ in the URL
          const publicUrl = result.secure_url;
          console.log('✅ PDF uploaded to Cloudinary:', publicUrl);
          resolve(publicUrl);
        }
      }
    );

    // Convert buffer to readable stream and pipe to Cloudinary
    const readable = new Readable();
    readable.push(pdfBuffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};