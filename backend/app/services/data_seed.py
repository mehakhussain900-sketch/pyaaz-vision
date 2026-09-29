"""
PYAAZ-VISION Database Seeder
Populates initial realistic demo data for APMC procurement centers, batches,
assessments, reports, alerts, and demo users.
"""
from datetime import datetime, date, timedelta
from ..core.database import SessionLocal, Base, engine
from ..models.schemas import (
    UserDB, ProcurementCenterDB, BatchDB, AssessmentSessionDB,
    SampleImageDB, DetectionDB, QualityResultDB, HumanVerificationDB,
    ReviewCaseDB, ReportDB, AlertDB
)


def seed_database_if_empty():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(ProcurementCenterDB).first():
            return

        # 1. Users
        inspector = UserDB(
            id="u-insp-01",
            email="inspector.deshmukh@pyaazvision.gov.in",
            hashed_password="demo_hashed_password",
            full_name="Inspector Anand K. Deshmukh",
            role="inspector",
            badge_number="MH-AGR-INSP-204"
        )
        supervisor = UserDB(
            id="u-sup-01",
            email="supervisor.patil@pyaazvision.gov.in",
            hashed_password="demo_hashed_password",
            full_name="Dr. Sunita Patil (Quality Officer)",
            role="supervisor",
            badge_number="MH-AGR-SUP-108"
        )
        db.add_all([inspector, supervisor])
        db.flush()

        # 2. Procurement Centers
        centers = [
            ProcurementCenterDB(
                id="c-lasalgaon",
                code="APMC-LASALGAON-01",
                name="Lasalgaon APMC Main Yard",
                district="Nashik",
                state="Maharashtra",
                capacity_mt=15000.0,
                active_intake=True
            ),
            ProcurementCenterDB(
                id="c-pimpalgaon",
                code="APMC-PIMPALGAON-02",
                name="Pimpalgaon Baswant Procurement Hub",
                district="Nashik",
                state="Maharashtra",
                capacity_mt=12000.0,
                active_intake=True
            ),
            ProcurementCenterDB(
                id="c-yeola",
                code="APMC-YEOLA-03",
                name="Yeola Sub-Market Yard",
                district="Nashik",
                state="Maharashtra",
                capacity_mt=8500.0,
                active_intake=True
            ),
            ProcurementCenterDB(
                id="c-mahuva",
                code="APMC-MAHUVA-04",
                name="Mahuva APMC Dehydration Cluster",
                district="Bhavnagar",
                state="Gujarat",
                capacity_mt=9500.0,
                active_intake=True
            ),
            ProcurementCenterDB(
                id="c-dindori",
                code="APMC-DINDORI-05",
                name="Dindori Direct Procurement Center",
                district="Nashik",
                state="Maharashtra",
                capacity_mt=6000.0,
                active_intake=True
            )
        ]
        db.add_all(centers)
        db.flush()

        # 3. Batches
        batch1 = BatchDB(
            id="b-0941",
            batch_number="BATCH-2026-NSK-0941",
            center_id="c-lasalgaon",
            supplier_farmer_id="MH-NSK-FRM-4892",
            farmer_name="Rameshwar Eknath Patil",
            farmer_contact="+91 98224 81920",
            variety="Nashik Red / Garwa",
            total_lot_weight_kg=6200.0,
            vehicle_number="MH-15-EG-8291",
            arrival_date=date.today(),
            status="APPROVED"
        )
        batch2 = BatchDB(
            id="b-1102",
            batch_number="BATCH-2026-PMP-1102",
            center_id="c-pimpalgaon",
            supplier_farmer_id="MH-PMP-FRM-3194",
            farmer_name="Balasaheb Kisan Shinde",
            farmer_contact="+91 97652 14320",
            variety="Garwa Medium",
            total_lot_weight_kg=4800.0,
            vehicle_number="MH-15-DX-4412",
            arrival_date=date.today() - timedelta(days=1),
            status="VERIFIED"
        )
        batch3 = BatchDB(
            id="b-0847",
            batch_number="BATCH-2026-YLA-0847",
            center_id="c-yeola",
            supplier_farmer_id="MH-YLA-FRM-9912",
            farmer_name="Vitthal Dagdu Jadhav",
            farmer_contact="+91 94231 66782",
            variety="Late Kharif (Rangda)",
            total_lot_weight_kg=5100.0,
            vehicle_number="MH-15-BV-9102",
            arrival_date=date.today() - timedelta(days=1),
            status="UNDER_REVIEW"
        )
        batch4 = BatchDB(
            id="b-0431",
            batch_number="BATCH-2026-MHV-0431",
            center_id="c-mahuva",
            supplier_farmer_id="GJ-BHV-FRM-2091",
            farmer_name="Dilipbhai Manjibhai Patel",
            farmer_contact="+91 98980 43219",
            variety="White Onion (Dehydration Grade)",
            total_lot_weight_kg=7800.0,
            vehicle_number="GJ-04-AT-7819",
            arrival_date=date.today() - timedelta(days=2),
            status="APPROVED"
        )
        batch5 = BatchDB(
            id="b-0955",
            batch_number="BATCH-2026-NSK-0955",
            center_id="c-lasalgaon",
            supplier_farmer_id="MH-NSK-FRM-1029",
            farmer_name="Shivaji Marutirao Gaikwad",
            farmer_contact="+91 98501 32984",
            variety="Nashik Red Bold",
            total_lot_weight_kg=5500.0,
            vehicle_number="MH-15-CP-1144",
            arrival_date=date.today(),
            status="APPROVED"
        )
        batch6 = BatchDB(
            id="b-0319",
            batch_number="BATCH-2026-DND-0319",
            center_id="c-dindori",
            supplier_farmer_id="MH-DND-FRM-6712",
            farmer_name="Pravin Bhaskar Bhamre",
            farmer_contact="+91 99238 77651",
            variety="Rangda Red",
            total_lot_weight_kg=4200.0,
            vehicle_number="MH-15-TR-2918",
            arrival_date=date.today(),
            status="PENDING_ASSESSMENT"
        )
        db.add_all([batch1, batch2, batch3, batch4, batch5, batch6])
        db.flush()

        # 4. Assessment Session for Batch 1 (Approved High Quality)
        sess1 = AssessmentSessionDB(
            id="as-0941",
            batch_id="b-0941",
            inspector_name="Inspector Anand K. Deshmukh",
            sample_size_count=60,
            stage="COMPLETED",
            scenario="high_quality"
        )
        db.add(sess1)
        db.flush()

        # Sample Image
        samp1 = SampleImageDB(
            id="samp-0941-1",
            assessment_id="as-0941",
            sample_index=1,
            image_url="/assets/sample-onion-tray-01.jpg",
            blur_score=94.2,
            brightness_score=89.0,
            framing_score=96.0,
            is_acceptable=True,
            quality_summary="Sharp focus and balanced illumination"
        )
        db.add(samp1)
        db.flush()

        # Quality Result
        qr1 = QualityResultDB(
            id="qr-0941",
            assessment_id="as-0941",
            total_onions_detected=60,
            grade_a_count=50,
            grade_a_pct=83.3,
            urs_count=8,
            urs_pct=13.3,
            damaged_count=1,
            damaged_pct=1.7,
            rotten_count=0,
            rotten_pct=0.0,
            sprouted_count=1,
            sprouted_pct=1.7,
            undersized_count=5,
            undersized_pct=8.3,
            defect_count=2,
            defect_rate_pct=3.3,
            average_diameter_mm=55.4,
            average_confidence=0.94,
            procurement_verdict="ACCEPTED_GRADE_A",
            recommended_action="Lot satisfies NAFED / APMC Grade A quality specifications. Approve for priority procurement."
        )
        db.add(qr1)

        # Human Verification
        hv1 = HumanVerificationDB(
            id="hv-0941",
            assessment_id="as-0941",
            inspector_name="Inspector Anand K. Deshmukh",
            action="ACCEPT_AI",
            ai_grade_a_pct=83.3,
            ai_urs_pct=13.3,
            ai_defect_pct=3.3,
            final_grade_a_pct=83.3,
            final_urs_pct=13.3,
            final_defect_pct=3.3,
            reason="Visual manual audit confirms accurate bounding and defect classification."
        )
        db.add(hv1)

        # Report
        rpt1 = ReportDB(
            id="rpt-0941",
            report_code="RPT-PV-2026-0941",
            assessment_id="as-0941",
            batch_id="b-0941",
            title="Prototype Digital Quality Assessment Report",
            qr_verification_code="PV-VERIFY-2026-NSK-0941-VALID",
            disclaimer="PROTOTYPE DEMONSTRATION RECORD: Generated by PYAAZ-VISION SIH prototype. Not an official statutory certificate."
        )
        db.add(rpt1)

        # Assessment Session for Batch 3 (Disputed / Under Review)
        sess3 = AssessmentSessionDB(
            id="as-0847",
            batch_id="b-0847",
            inspector_name="Inspector Anand K. Deshmukh",
            sample_size_count=60,
            stage="COMPLETED",
            scenario="high_damage"
        )
        db.add(sess3)
        db.flush()

        qr3 = QualityResultDB(
            id="qr-0847",
            assessment_id="as-0847",
            total_onions_detected=60,
            grade_a_count=26,
            grade_a_pct=43.3,
            urs_count=18,
            urs_pct=30.0,
            damaged_count=10,
            damaged_pct=16.7,
            rotten_count=3,
            rotten_pct=5.0,
            sprouted_count=3,
            sprouted_pct=5.0,
            undersized_count=12,
            undersized_pct=20.0,
            defect_count=16,
            defect_rate_pct=26.7,
            average_diameter_mm=46.2,
            average_confidence=0.91,
            procurement_verdict="REJECTED_HIGH_DEFECTS",
            recommended_action="High incidence of harvest cuts and bacterial rot detected. Farmer requested secondary manual arbitration."
        )
        db.add(qr3)

        rev3 = ReviewCaseDB(
            id="rev-0847",
            assessment_id="as-0847",
            batch_id="b-0847",
            flagged_by_name="Farmer Representative V. D. Jadhav",
            reason="AI result appears inconsistent",
            explanation="Farmer disputes rot classification, arguing black marks are superficial soil smudges from dry harvesting.",
            status="Under Review"
        )
        db.add(rev3)

        # Alerts
        alerts = [
            AlertDB(
                center_id="c-yeola",
                batch_id="b-0847",
                alert_type="HIGH_DEFECT_RATE",
                severity="CRITICAL",
                title="Critical Defect Threshold Exceeded",
                message="Batch BATCH-2026-YLA-0847 exceeded 25% total defects (Cuts: 16.7%, Rot: 5.0%). Assessment flagged for committee review."
            ),
            AlertDB(
                center_id="c-dindori",
                batch_id="b-0319",
                alert_type="INCOMPLETE_SAMPLING",
                severity="INFO",
                title="Intake Waiting for Sampling",
                message="Vehicle MH-15-TR-2918 unloaded at Yard 2. Quality assessment pending."
            ),
            AlertDB(
                center_id="c-pimpalgaon",
                batch_id="b-1102",
                alert_type="HIGH_SPROUTING",
                severity="WARNING",
                title="Sprouting Alert in Rangda Stock",
                message="Pimpalgaon reports elevated 8% dormancy break in stored arrivals due to unseasonal rain."
            )
        ]
        db.add_all(alerts)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()
