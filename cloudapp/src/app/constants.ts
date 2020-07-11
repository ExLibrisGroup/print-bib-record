export class Constants {
    public static XSL_FILES = [
		{ id: 'MARC21ColumnarFormat.xsl', name: 'MARC21 Columnar Format' },
		{ id: 'MARC21slim2English.xsl',   name: 'MARC21 slim 2 English' },
		{ id: 'AllFormatsCitation.xsl', name: 'Citation Format' }
      ];
    static SAMPLE_MARCXML: string = `<collection>
	<record>
		<leader>00826cam a2200277 a 4500</leader>
		<controlfield tag="001">33797</controlfield>
		<controlfield tag="003">OCoLC</controlfield>
		<controlfield tag="008">831018s1984    nyu      b    000 0 eng</controlfield>
		<datafield ind1="1" ind2=" " tag="100">
			<subfield code="a">Draper, Theodore,</subfield>
			<subfield code="d">1912-</subfield>
		</datafield>
		<datafield ind1="1" ind2="0" tag="245">
			<subfield code="a">Present history /</subfield>
			<subfield code="c">Theodore Draper.</subfield>
		</datafield>
		<mms_id>991371230000541</mms_id>
		<title>Present history /</title>
		<author>Draper, Theodore,</author>
	</record>
	<record>
		<leader>01070aam a2200313 a 4500</leader>
		<controlfield tag="001">991439870000541</controlfield>
		<controlfield tag="008">900326s1990    dcua     bf  f001 0 eng</controlfield>
		<controlfield tag="005">20150916161518.0</controlfield>
		<datafield ind1="1" ind2=" " tag="100">
			<subfield code="a">Kavanagh, Gaynor.</subfield>
		</datafield>
		<datafield ind1="1" ind2="0" tag="245">
			<subfield code="a">History curatorship /</subfield>
			<subfield code="c">by Gaynor Kavanagh.</subfield>
		</datafield>
		<mms_id>991439870000541</mms_id>
		<title>History curatorship /</title>
		<author>Kavanagh, Gaynor.</author>
	</record>
</collection>`;
 }
 