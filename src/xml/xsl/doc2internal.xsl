<?xml version="1.0" encoding="utf-8"?>
<!-- Transforms a document into the format used internally by CWRCWriter. -->
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">
	<xsl:apply-templates mode="root"/>
</xsl:template>

<xsl:template match="*" mode="root">
<xsl:copy>
	<xsl:copy-of select="@*" />
	<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:w="http://cwrctc.artsrn.ualberta.ca/#"></rdf:RDF>
	<xsl:apply-templates mode="children"/>
</xsl:copy>
</xsl:template>

<xsl:template match="*" mode="children">
<xsl:variable name="tag" select="local-name()" />
<span _tag="{$tag}" _struct="true">
	<xsl:copy-of select="@*" />
	<xsl:apply-templates mode="children"/>
</span>
</xsl:template>

</xsl:stylesheet>