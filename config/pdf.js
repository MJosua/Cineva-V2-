const { dbQuery } = require("../config/db");
const fs = require('fs');
const ejs = require('ejs');
const puppeteer = require('puppeteer');

export const generatePDF = async (order_id) => {

    let date = new Date();
    let timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ' + ' ';

    const templatePath = './layout.html';
    const template = fs.readFileSync(templatePath, 'utf-8');
    /*
        let query = await dbQuery(`
        SELECT a.so_id, a.so_number, upper(date_format(a.po_date,'%d-%b-%Y')) AS so_date, a.po_number, upper(concat(date_format(a.delv_date,'%d-%b-%Y'),' week ',right(concat('0', a.week_delv),2))) AS tentative_stuff,
            coalesce(upper(concat(e.harbour_name, ', ', e.harbour_desc)),'') AS port_shipment, coalesce(upper(h.harbour_name),'') port_discharge, b.sku_id, upper(coalesce(c.product_name_no, c.product_name)) product_name,
            b.quantity, c.per_carton, CASE WHEN (pt.product_type_id & 256) <> 0 THEN 'PACKS' WHEN (pt.product_type_id & 128) THEN 'CUPS' WHEN (pt.product_type_id & 64) THEN 'CUPS' WHEN (pt.product_type_id & 32) THEN 'CUPS' END AS uom, b.value, b.quantity * (b.value - coalesce(b.disc,0)) AS amount, 
            upper(concat(CASE a.incoterm WHEN 1 THEN 'CIF' WHEN 2 THEN 'FOB' WHEN 3 THEN 'CNF' WHEN 4 THEN 'DAP' END, ' ', CASE a.incoterm WHEN 1 THEN (CASE WHEN LENGTH(trim(coalesce(a.cif_to,''))) = 0 THEN h.harbour_name ELSE a.cif_to END) WHEN 2 THEN e.harbour_name WHEN 3 THEN (CASE WHEN LENGTH(trim(coalesce(a.cif_to,''))) = 0 THEN h.harbour_name ELSE a.cif_to END) WHEN 4 THEN coalesce(upper(concat(e.harbour_name, ', ', e.harbour_desc)),'')  END)) incoterm,
            upper(number_to_word(i.ttl_amount, CASE WHEN f.curr_code <> 'USD' THEN f.curr_code ELSE b.rate_unit END)) say_total, i.ttl_amount, a.completion_note, coalesce(a.so_desc,'') so_desc, coalesce(a.trade_promo, "") trade_promo, record_count, b.detail_nr, coalesce(b.disc,0) AS disc, coalesce(a.final_dest, coalesce(upper(h.harbour_name)),'') final_dest, j.top_desc 'desc',
            CASE WHEN ship.company_id IS NOT NULL THEN concat_ws(CHAR(10 using utf8),ship.company_name, ship_addr.street, ship_addr.complex, ship_addr.city) ELSE concat_ws(CHAR(10 using utf8),f.company_name, consignee.street, consignee.complex, consignee.city) END consignee, 
            CASE WHEN notify1.company_id IS NULL THEN CASE WHEN ship.company_id IS NOT NULL THEN concat_ws(CHAR(10 using utf8),ship.company_name, ship_addr.street, ship_addr.complex, ship_addr.city) ELSE concat_ws(CHAR(10 using utf8),f.company_name, consignee.street, consignee.complex, consignee.city) END ELSE concat_ws(CHAR(10 using utf8), notify1.company_name, notify_addr.street, notify_addr.complex, notify_addr.city) END notify, 
            concat_ws(CHAR(10 using utf8),notify2.company_name, notify_addr2.street, notify_addr2.complex, notify_addr2.city) notify2, 
            concat_ws(CHAR(10 using utf8), bill.company_name, bill_addr.street, bill_addr.complex, bill_addr.city) bill, 
            coalesce(factory.street,'') as fac_street, coalesce(factory.complex,'') as fac_complex, coalesce(factory.city, '') as fac_city,
            coalesce(factory.regency,'') fac_telp, coalesce(factory.province,'') fac_telp2, coalesce(factory.postal_code,'') fac_fax, date_format(a.po_date, '%Y') AS so_year,
            ev1.flag appr1, concat(COALESCE(p1.firstname,''),' ',coalesce(p1.lastname,'')) approver1, ev2.flag appr2, concat(COALESCE(p2.firstname,''),' ',coalesce(p2.lastname,'')) approver2,
            ev3.flag appr3, e3.team_name approver3, ev4.flag appr4, concat(COALESCE(p4.firstname,''),' ',coalesce(p4.lastname,'')) approver4, COALESCE(date_format(ev1.appr_date,'%d %b %Y %H:%i:%s'),'') appr_date1,
            COALESCE(date_format(ev2.appr_date,'%d %b %Y %H:%i:%s'),'') appr_date2,COALESCE(date_format(ev3.appr_date,'%d %b %Y %H:%i:%s'),'') appr_date3,COALESCE(date_format(ev4.appr_date,'%d %b %Y %H:%i:%s'),'') appr_date4,
            (b.quantity * coalesce(b.freight_surcharge,0)) freight, coalesce(b.freight_surcharge,0) freight_unit, CASE f.curr_code WHEN 'IDR' THEN f.curr_code ELSE b.rate_unit END rate_unit, coalesce(ev1.employee_id,0) emp1,coalesce(ev2.employee_id,0) emp2,'log' emp3, coalesce(ev4.employee_id,0) emp4, CASE a.incoterm WHEN 1 THEN 'CIF' WHEN 2 THEN 'FOB' WHEN 3 THEN 'CNF' WHEN 4 THEN 'DAP' END inco, f.dist_channel,
            coalesce(a.oth_anp, "") oth_anp, concat(trim(c.product_desc)," x ", trim(c.per_carton), " Packs") AS content, ev5.flag appr5, concat(COALESCE(p5.firstname,''),' ',coalesce(p5.lastname,'')) approver5, COALESCE(date_format(ev5.appr_date,'%d %b %Y %H:%i:%s'),'') appr_date5
        FROM trs_sales_order a
            INNER JOIN trs_so_detail b ON 
             a.so_id = b.so_id
             AND a.client_id = b.client_id
             AND a.version = b.version
             AND a.company_id = b.company_id
            INNER JOIN m_order online ON 
             a.e_order = online.order_id 
            LEFT JOIN mst_product c ON 
             b.sku_id = c.product_code
             AND b.company_id = c.company_id
            LEFT JOIN mst_product_type pt ON 
             c.product_type_id = pt.product_type_id 
             AND c.company_id = pt.company_id 
             AND c.division_id = pt.division_id 
            LEFT JOIN mst_factory d ON 
             a.factory_id = d.factory_id
             AND b.company_id = d.company_id
            LEFT JOIN mst_harbour e ON 
             d.harbour_id = e.harbour_id
            LEFT JOIN mst_company f ON 
             a.client_id = f.company_id
            LEFT JOIN mst_harbour h ON 
             a.port_shipment = h.harbour_id
            LEFT JOIN (SELECT so_id, client_id, sum(quantity * (value - coalesce(disc,0) + coalesce(freight_surcharge,0))) ttl_amount, max(detail_nr) record_count FROM trs_so_detail GROUP BY so_id, client_id) i ON 
             a.so_id = i.so_id
             AND a.client_id = i.client_id
            LEFT JOIN mst_top j ON 
             a.client_id = j.company_id AND a.top_id = j.top_id 
             AND a.po_date between j.start_date and coalesce(j.expired_date, '9999-12-31')
            LEFT JOIN mst_top_foreign_code k ON 
             j.top_sap_code = k.id AND j.company_id = a.company_id 
             AND k.active = 1
            LEFT JOIN mst_company notify1 ON 
             a.notify_party = notify1.company_id
            LEFT JOIN address notify_addr ON 
             notify1.address_id = notify_addr.address_id
            LEFT JOIN mst_company notify2 ON 
             a.notify_party2 = notify2.company_id
            LEFT JOIN address notify_addr2 ON 
             notify2.address_id = notify_addr2.address_id
            LEFT JOIN mst_company bill ON 
             a.bill_to_party = bill.company_id
            LEFT JOIN address bill_addr ON 
             bill.address_id = bill_addr.address_id
            LEFT JOIN address consignee ON 
             f.address_id = consignee.address_id
            LEFT JOIN address factory on
             d.plant = CAST(factory.community AS UNSIGNED)
            LEFT JOIN mst_company ship ON 
             a.ship_to_id = ship.company_id 
            LEFT JOIN address ship_addr ON 
             ship.address_id = ship_addr.address_id
            LEFT JOIN trs_approval appr ON 
             a.approval_id  = appr.id AND a.so_id = appr.key AND a.company_id = appr.company_id 
            LEFT JOIN trs_approval_event ev1 ON 
             appr.id = ev1.appr_id AND appr.company_id = ev1.company_id AND ev1.id = 1
            LEFT JOIN trs_approval_event ev2 ON 
             appr.id = ev2.appr_id AND appr.company_id = ev2.company_id AND ev2.id = 4
            LEFT JOIN trs_approval_event ev3 ON 
             appr.id = ev3.appr_id AND appr.company_id = ev3.company_id AND ev3.id = 2
            LEFT JOIN trs_approval_event ev4 ON 
             appr.id = ev4.appr_id AND appr.company_id = ev4.company_id AND ev4.id = 3
            LEFT JOIN trs_approval_event ev5 ON 
             appr.id = ev5.appr_id AND appr.company_id = ev5.company_id AND ev5.id = 5
            LEFT JOIN mst_employee e1 ON 
             ev1.employee_id = e1.employee_id AND ev1.company_id = e1.company_id 
            LEFT JOIN person p1 ON 
             e1.person_id = p1.person_id 
            LEFT JOIN mst_employee e2 ON 
             ev2.employee_id = e2.employee_id AND ev2.company_id = e2.company_id 
            LEFT JOIN person p2 ON 
             e2.person_id = p2.person_id 
            LEFT JOIN mst_team e3 ON 
             e3.team_id = 27 AND ev3.company_id = e3.company_id 
            LEFT JOIN mst_employee e4 ON 
             ev4.employee_id = e4.employee_id AND ev4.company_id = e4.company_id 
            LEFT JOIN person p4 ON 
             e4.person_id = p4.person_id
            LEFT JOIN mst_employee e5 ON 
             ev5.employee_id = e5.employee_id AND ev5.company_id = e5.company_id 
            LEFT JOIN person p5 ON 
             e5.person_id = p5.person_id
        WHERE
             online.order_id = ${order_id}
        AND COALESCE(a.cancel,0) = 0
             ORDER BY
             b.detail_nr;`);
    */
    const query = [
        {
            so_id: 230015000011,
            so_number: null,
            so_date: '09-NOV-2023',
            po_number: 'PO Test Pricing 01',
            tentative_stuff: '11-DEC-2023 WEEK 50',
            port_shipment: '',
            port_discharge: 'ASIA WORLD PORT, YANGON',
            sku_id: 417580,
            product_name: 'INDOMIE MI GRG AYAM GEPREK (IHAG) MYM 40',
            quantity: 3840,
            per_carton: 40,
            uom: 'PACKS',
            value: '7.90',
            amount: '30336.000',
            incoterm: 'CIF MYANMAR',
            say_total: 'THIRTY THOUSAND THREE HUNDRED THIRTY SIX DOLLARS',
            ttl_amount: '30336.000',
            completion_note: '1 X 40 HC / 66',
            so_desc: 'PO Test Pricing',
            trade_promo: '',
            record_count: 1,
            detail_nr: 1,
            disc: '0.000',
            final_dest: 'MYANMAR',
            desc: 'TT in full amount 60 days after BL date',
            consignee: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify2: '',
            bill: '',
            fac_street: '',
            fac_complex: '',
            fac_city: '',
            fac_telp: '',
            fac_telp2: '',
            fac_fax: '',
            so_year: '2023',
            appr1: null,
            approver1: ' ',
            appr2: null,
            approver2: ' ',
            appr3: null,
            approver3: null,
            appr4: null,
            approver4: ' ',
            appr_date1: '',
            appr_date2: '',
            appr_date3: '',
            appr_date4: '',
            freight: '0.000',
            freight_unit: '0.000',
            rate_unit: 'USD',
            emp1: 0,
            emp2: 0,
            emp3: 'log',
            emp4: 0,
            inco: 'CIF',
            dist_channel: 2,
            oth_anp: '',
            content: null,
            appr5: null,
            approver5: ' ',
            appr_date5: ''
        },
        {
            so_id: 230015000011,
            so_number: null,
            so_date: '09-NOV-2023',
            po_number: 'PO Test Pricing 01',
            tentative_stuff: '11-DEC-2023 WEEK 50',
            port_shipment: '',
            port_discharge: 'ASIA WORLD PORT, YANGON',
            sku_id: 66666,
            product_name: 'INDOMIE MIE GORENG PEDES SETAN',
            quantity: 3840,
            per_carton: 40,
            uom: 'PACKS',
            value: '7.90',
            amount: '30336.000',
            incoterm: 'CIF MYANMAR',
            say_total: 'THIRTY THOUSAND THREE HUNDRED THIRTY SIX DOLLARS',
            ttl_amount: '30336.000',
            completion_note: '1 X 40 HC / 66',
            so_desc: 'PO Test Pricing',
            trade_promo: '',
            record_count: 1,
            detail_nr: 1,
            disc: '0.000',
            final_dest: 'MYANMAR',
            desc: 'TT in full amount 60 days after BL date',
            consignee: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify2: '',
            bill: '',
            fac_street: '',
            fac_complex: '',
            fac_city: '',
            fac_telp: '',
            fac_telp2: '',
            fac_fax: '',
            so_year: '2023',
            appr1: null,
            approver1: ' ',
            appr2: null,
            approver2: ' ',
            appr3: null,
            approver3: null,
            appr4: null,
            approver4: ' ',
            appr_date1: '',
            appr_date2: '',
            appr_date3: '',
            appr_date4: '',
            freight: '0.000',
            freight_unit: '0.000',
            rate_unit: 'USD',
            emp1: 0,
            emp2: 0,
            emp3: 'log',
            emp4: 0,
            inco: 'CIF',
            dist_channel: 2,
            oth_anp: '',
            content: null,
            appr5: null,
            approver5: ' ',
            appr_date5: ''
        },
        {
            so_id: 230015000011,
            so_number: null,
            so_date: '09-NOV-2023',
            po_number: 'PO Test Pricing 01',
            tentative_stuff: '11-DEC-2023 WEEK 50',
            port_shipment: '',
            port_discharge: 'ASIA WORLD PORT, YANGON',
            sku_id: 777777,
            product_name: 'INDOMIE MIE APA LAGI',
            quantity: 3840,
            per_carton: 40,
            uom: 'PACKS',
            value: '7.90',
            amount: '30336.000',
            incoterm: 'CIF MYANMAR',
            say_total: 'THIRTY THOUSAND THREE HUNDRED THIRTY SIX DOLLARS',
            ttl_amount: '30336.000',
            completion_note: '1 X 40 HC / 66',
            so_desc: 'PO Test Pricing',
            trade_promo: '',
            record_count: 1,
            detail_nr: 1,
            disc: '0.000',
            final_dest: 'MYANMAR',
            desc: 'TT in full amount 60 days after BL date',
            consignee: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify2: '',
            bill: '',
            fac_street: '',
            fac_complex: '',
            fac_city: '',
            fac_telp: '',
            fac_telp2: '',
            fac_fax: '',
            so_year: '2023',
            appr1: null,
            approver1: ' ',
            appr2: null,
            approver2: ' ',
            appr3: null,
            approver3: null,
            appr4: null,
            approver4: ' ',
            appr_date1: '',
            appr_date2: '',
            appr_date3: '',
            appr_date4: '',
            freight: '0.000',
            freight_unit: '0.000',
            rate_unit: 'USD',
            emp1: 0,
            emp2: 0,
            emp3: 'log',
            emp4: 0,
            inco: 'CIF',
            dist_channel: 2,
            oth_anp: '',
            content: null,
            appr5: null,
            approver5: ' ',
            appr_date5: ''
        },
        {
            so_id: 230015000011,
            so_number: null,
            so_date: '09-NOV-2023',
            po_number: 'PO Test Pricing 01',
            tentative_stuff: '11-DEC-2023 WEEK 50',
            port_shipment: '',
            port_discharge: 'ASIA WORLD PORT, YANGON',
            sku_id: 417580,
            product_name: 'INDOMIE MI GRG AYAM GEPREK (IHAG) MYM 40',
            quantity: 3840,
            per_carton: 40,
            uom: 'PACKS',
            value: '7.90',
            amount: '30336.000',
            incoterm: 'CIF MYANMAR',
            say_total: 'THIRTY THOUSAND THREE HUNDRED THIRTY SIX DOLLARS',
            ttl_amount: '30336.000',
            completion_note: '1 X 40 HC / 66',
            so_desc: 'PO Test Pricing',
            trade_promo: '',
            record_count: 1,
            detail_nr: 1,
            disc: '0.000',
            final_dest: 'MYANMAR',
            desc: 'TT in full amount 60 days after BL date',
            consignee: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify2: '',
            bill: '',
            fac_street: '',
            fac_complex: '',
            fac_city: '',
            fac_telp: '',
            fac_telp2: '',
            fac_fax: '',
            so_year: '2023',
            appr1: null,
            approver1: ' ',
            appr2: null,
            approver2: ' ',
            appr3: null,
            approver3: null,
            appr4: null,
            approver4: ' ',
            appr_date1: '',
            appr_date2: '',
            appr_date3: '',
            appr_date4: '',
            freight: '0.000',
            freight_unit: '0.000',
            rate_unit: 'USD',
            emp1: 0,
            emp2: 0,
            emp3: 'log',
            emp4: 0,
            inco: 'CIF',
            dist_channel: 2,
            oth_anp: '',
            content: null,
            appr5: null,
            approver5: ' ',
            appr_date5: ''
        },
        {
            so_id: 230015000011,
            so_number: null,
            so_date: '09-NOV-2023',
            po_number: 'PO Test Pricing 01',
            tentative_stuff: '11-DEC-2023 WEEK 50',
            port_shipment: '',
            port_discharge: 'ASIA WORLD PORT, YANGON',
            sku_id: 66666,
            product_name: 'INDOMIE MIE GORENG PEDES SETAN',
            quantity: 3840,
            per_carton: 40,
            uom: 'PACKS',
            value: '7.90',
            amount: '30336.000',
            incoterm: 'CIF MYANMAR',
            say_total: 'THIRTY THOUSAND THREE HUNDRED THIRTY SIX DOLLARS',
            ttl_amount: '30336.000',
            completion_note: '1 X 40 HC / 66',
            so_desc: 'PO Test Pricing',
            trade_promo: '',
            record_count: 1,
            detail_nr: 1,
            disc: '0.000',
            final_dest: 'MYANMAR',
            desc: 'TT in full amount 60 days after BL date',
            consignee: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify2: '',
            bill: '',
            fac_street: '',
            fac_complex: '',
            fac_city: '',
            fac_telp: '',
            fac_telp2: '',
            fac_fax: '',
            so_year: '2023',
            appr1: null,
            approver1: ' ',
            appr2: null,
            approver2: ' ',
            appr3: null,
            approver3: null,
            appr4: null,
            approver4: ' ',
            appr_date1: '',
            appr_date2: '',
            appr_date3: '',
            appr_date4: '',
            freight: '0.000',
            freight_unit: '0.000',
            rate_unit: 'USD',
            emp1: 0,
            emp2: 0,
            emp3: 'log',
            emp4: 0,
            inco: 'CIF',
            dist_channel: 2,
            oth_anp: '',
            content: null,
            appr5: null,
            approver5: ' ',
            appr_date5: ''
        },
        {
            so_id: 230015000011,
            so_number: null,
            so_date: '09-NOV-2023',
            po_number: 'PO Test Pricing 01',
            tentative_stuff: '11-DEC-2023 WEEK 50',
            port_shipment: '',
            port_discharge: 'ASIA WORLD PORT, YANGON',
            sku_id: 777777,
            product_name: 'INDOMIE MIE APA LAGI',
            quantity: 3840,
            per_carton: 40,
            uom: 'PACKS',
            value: '7.90',
            amount: '30336.000',
            incoterm: 'CIF MYANMAR',
            say_total: 'THIRTY THOUSAND THREE HUNDRED THIRTY SIX DOLLARS',
            ttl_amount: '30336.000',
            completion_note: '1 X 40 HC / 66',
            so_desc: 'PO Test Pricing',
            trade_promo: '',
            record_count: 1,
            detail_nr: 1,
            disc: '0.000',
            final_dest: 'MYANMAR',
            desc: 'TT in full amount 60 days after BL date',
            consignee: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify2: '',
            bill: '',
            fac_street: '',
            fac_complex: '',
            fac_city: '',
            fac_telp: '',
            fac_telp2: '',
            fac_fax: '',
            so_year: '2023',
            appr1: null,
            approver1: ' ',
            appr2: null,
            approver2: ' ',
            appr3: null,
            approver3: null,
            appr4: null,
            approver4: ' ',
            appr_date1: '',
            appr_date2: '',
            appr_date3: '',
            appr_date4: '',
            freight: '0.000',
            freight_unit: '0.000',
            rate_unit: 'USD',
            emp1: 0,
            emp2: 0,
            emp3: 'log',
            emp4: 0,
            inco: 'CIF',
            dist_channel: 2,
            oth_anp: '',
            content: null,
            appr5: null,
            approver5: ' ',
            appr_date5: ''
        },
        {
            so_id: 230015000011,
            so_number: null,
            so_date: '09-NOV-2023',
            po_number: 'PO Test Pricing 01',
            tentative_stuff: '11-DEC-2023 WEEK 50',
            port_shipment: '',
            port_discharge: 'ASIA WORLD PORT, YANGON',
            sku_id: 417580,
            product_name: 'INDOMIE MI GRG AYAM GEPREK (IHAG) MYM 40',
            quantity: 3840,
            per_carton: 40,
            uom: 'PACKS',
            value: '7.90',
            amount: '30336.000',
            incoterm: 'CIF MYANMAR',
            say_total: 'THIRTY THOUSAND THREE HUNDRED THIRTY SIX DOLLARS',
            ttl_amount: '30336.000',
            completion_note: '1 X 40 HC / 66',
            so_desc: 'PO Test Pricing',
            trade_promo: '',
            record_count: 1,
            detail_nr: 1,
            disc: '0.000',
            final_dest: 'MYANMAR',
            desc: 'TT in full amount 60 days after BL date',
            consignee: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify2: '',
            bill: '',
            fac_street: '',
            fac_complex: '',
            fac_city: '',
            fac_telp: '',
            fac_telp2: '',
            fac_fax: '',
            so_year: '2023',
            appr1: null,
            approver1: ' ',
            appr2: null,
            approver2: ' ',
            appr3: null,
            approver3: null,
            appr4: null,
            approver4: ' ',
            appr_date1: '',
            appr_date2: '',
            appr_date3: '',
            appr_date4: '',
            freight: '0.000',
            freight_unit: '0.000',
            rate_unit: 'USD',
            emp1: 0,
            emp2: 0,
            emp3: 'log',
            emp4: 0,
            inco: 'CIF',
            dist_channel: 2,
            oth_anp: '',
            content: null,
            appr5: null,
            approver5: ' ',
            appr_date5: ''
        },
        {
            so_id: 230015000011,
            so_number: null,
            so_date: '09-NOV-2023',
            po_number: 'PO Test Pricing 01',
            tentative_stuff: '11-DEC-2023 WEEK 50',
            port_shipment: '',
            port_discharge: 'ASIA WORLD PORT, YANGON',
            sku_id: 66666,
            product_name: 'INDOMIE MIE GORENG PEDES SETAN',
            quantity: 3840,
            per_carton: 40,
            uom: 'PACKS',
            value: '7.90',
            amount: '30336.000',
            incoterm: 'CIF MYANMAR',
            say_total: 'THIRTY THOUSAND THREE HUNDRED THIRTY SIX DOLLARS',
            ttl_amount: '30336.000',
            completion_note: '1 X 40 HC / 66',
            so_desc: 'PO Test Pricing',
            trade_promo: '',
            record_count: 1,
            detail_nr: 1,
            disc: '0.000',
            final_dest: 'MYANMAR',
            desc: 'TT in full amount 60 days after BL date',
            consignee: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify2: '',
            bill: '',
            fac_street: '',
            fac_complex: '',
            fac_city: '',
            fac_telp: '',
            fac_telp2: '',
            fac_fax: '',
            so_year: '2023',
            appr1: null,
            approver1: ' ',
            appr2: null,
            approver2: ' ',
            appr3: null,
            approver3: null,
            appr4: null,
            approver4: ' ',
            appr_date1: '',
            appr_date2: '',
            appr_date3: '',
            appr_date4: '',
            freight: '0.000',
            freight_unit: '0.000',
            rate_unit: 'USD',
            emp1: 0,
            emp2: 0,
            emp3: 'log',
            emp4: 0,
            inco: 'CIF',
            dist_channel: 2,
            oth_anp: '',
            content: null,
            appr5: null,
            approver5: ' ',
            appr_date5: ''
        },

        {
            so_id: 230015000011,
            so_number: null,
            so_date: '09-NOV-2023',
            po_number: 'PO Test Pricing 01',
            tentative_stuff: '11-DEC-2023 WEEK 50',
            port_shipment: '',
            port_discharge: 'ASIA WORLD PORT, YANGON',
            sku_id: 66666,
            product_name: 'INDOMIE MIE GORENG PEDES SETAN',
            quantity: 3840,
            per_carton: 40,
            uom: 'PACKS',
            value: '7.90',
            amount: '30336.000',
            incoterm: 'CIF MYANMAR',
            say_total: 'THIRTY THOUSAND THREE HUNDRED THIRTY SIX DOLLARS',
            ttl_amount: '30336.000',
            completion_note: '1 X 40 HC / 66',
            so_desc: 'PO Test Pricing',
            trade_promo: '',
            record_count: 1,
            detail_nr: 1,
            disc: '0.000',
            final_dest: 'MYANMAR',
            desc: 'TT in full amount 60 days after BL date',
            consignee: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify2: '',
            bill: '',
            fac_street: '',
            fac_complex: '',
            fac_city: '',
            fac_telp: '',
            fac_telp2: '',
            fac_fax: '',
            so_year: '2023',
            appr1: null,
            approver1: ' ',
            appr2: null,
            approver2: ' ',
            appr3: null,
            approver3: null,
            appr4: null,
            approver4: ' ',
            appr_date1: '',
            appr_date2: '',
            appr_date3: '',
            appr_date4: '',
            freight: '0.000',
            freight_unit: '0.000',
            rate_unit: 'USD',
            emp1: 0,
            emp2: 0,
            emp3: 'log',
            emp4: 0,
            inco: 'CIF',
            dist_channel: 2,
            oth_anp: '',
            content: null,
            appr5: null,
            approver5: ' ',
            appr_date5: ''
        },
        {
            so_id: 230015000011,
            so_number: null,
            so_date: '09-NOV-2023',
            po_number: 'PO Test Pricing 01',
            tentative_stuff: '11-DEC-2023 WEEK 50',
            port_shipment: '',
            port_discharge: 'ASIA WORLD PORT, YANGON',
            sku_id: 777777,
            product_name: 'INDOMIE MIE APA LAGI',
            quantity: 3840,
            per_carton: 40,
            uom: 'PACKS',
            value: '7.90',
            amount: '30336.000',
            incoterm: 'CIF MYANMAR',
            say_total: 'THIRTY THOUSAND THREE HUNDRED THIRTY SIX DOLLARS',
            ttl_amount: '30336.000',
            completion_note: '1 X 40 HC / 66',
            so_desc: 'PO Test Pricing',
            trade_promo: '',
            record_count: 1,
            detail_nr: 1,
            disc: '0.000',
            final_dest: 'MYANMAR',
            desc: 'TT in full amount 60 days after BL date',
            consignee: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify: 'Impetus International Trading\n' +
                'No.33, 6 1/2 Mile, Pyay Road, 11 Quarter\n' +
                'Hlaing Township\n' +
                'Yangon',
            notify2: '',
            bill: '',
            fac_street: '',
            fac_complex: '',
            fac_city: '',
            fac_telp: '',
            fac_telp2: '',
            fac_fax: '',
            so_year: '2023',
            appr1: null,
            approver1: ' ',
            appr2: null,
            approver2: ' ',
            appr3: null,
            approver3: null,
            appr4: null,
            approver4: ' ',
            appr_date1: '',
            appr_date2: '',
            appr_date3: '',
            appr_date4: '',
            freight: '0.000',
            freight_unit: '0.000',
            rate_unit: 'USD',
            emp1: 0,
            emp2: 0,
            emp3: 'log',
            emp4: 0,
            inco: 'CIF',
            dist_channel: 2,
            oth_anp: '',
            content: null,
            appr5: null,
            approver5: ' ',
            appr_date5: ''
        },
    ];

    let header = await piData[0];

    const compiledTemplate = ejs.render(template, { header, query });

    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        // Set content of the page
        await page.setContent(compiledTemplate);

        // Generate PDF
        const pdf = await page.pdf();

        await browser.close();

        res.contentType('application/pdf');
        res.status(200).send(pdf);

        console.log(`${timestamp} PDF has been generated for order_id: ${order_id}`)
    } catch (err) {
        console.log(`${timestamp} Error generating PDF report for order_id: ${order_id} message: ${err}`)
        res.status(400).send('Error generating PDF report');
    }


}