<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" encoding="utf-8" />
	<xsl:template match="/">
		<xsl:for-each select="collection/record">

			<xsl:value-of select="author" />
			author :
			<xsl:value-of select="title" />
			:
			<xsl:value-of select="publisher_const" />, 
			 
			<xsl:value-of select="date_of_publication" />
			<xsl:if test="isbn != ''">
				[ISBN<xsl:value-of select="isbn" />]
			</xsl:if>
			<xsl:if test="issn != ''">
				[ISSN<xsl:value-of select="issn" />]
			</xsl:if>
			(#<xsl:value-of select="mms_id" />)
			<br/>

		</xsl:for-each>
	</xsl:template>
</xsl:stylesheet>
