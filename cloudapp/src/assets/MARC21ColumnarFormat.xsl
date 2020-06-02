<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" encoding="utf-8" />
	<xsl:template match="/">
		<table border="1">
			<tr>
				<td>ID</td>
				<td>Author</td>
				<td>Title</td>
				<td>Publ.</td>
				<td>Other system no.</td>
			</tr>
			<xsl:for-each select="collection/record">
				<tr>
					<td>
						<xsl:value-of select="mms_id" />
					</td>
					<td>
						<xsl:value-of select="datafield[@tag='100']/subfield[@code='a']" />
					</td>
					<td>
						<xsl:value-of select="datafield[@tag='245']/subfield[@code='a']" />
					</td>
					<td>
						<xsl:value-of select="datafield[@tag='260']/subfield[@code='a']" /><xsl:text> </xsl:text> 
						<xsl:value-of select="datafield[@tag='260']/subfield[@code='b']" /><xsl:text> </xsl:text> 
						<xsl:value-of select="datafield[@tag='260']/subfield[@code='c']" /> 
					</td>
					<td>
						<xsl:for-each select="datafield[@tag='035']/subfield[@code='a']">
							<xsl:value-of select="." />			<br/>
						</xsl:for-each>
					</td>
				</tr>
			</xsl:for-each>
		</table>
	</xsl:template>

</xsl:stylesheet>
