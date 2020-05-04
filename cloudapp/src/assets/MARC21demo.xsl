<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="xml" encoding="utf-8" />
<xsl:template match="/">
  <p>Leader: 
    <xsl:value-of select="//leader" /></p>
  <p>controlfield 008:
    <xsl:value-of select="//controlfield[@tag='008']" /></p>
  <p>Title:
    <xsl:value-of select="//datafield[@tag='245']/subfield[@code='a']" /></p>
</xsl:template>
</xsl:stylesheet>